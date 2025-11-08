'use client'

import { useState, useEffect } from 'react'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { formatPrice } from '../lib/utils'
import toast from 'react-hot-toast'
import { CreditCardIcon } from '@heroicons/react/24/outline'

interface CheckoutFormProps {
  total: number
  subtotal: number
  deliveryFee: number
  tax: number
  cartLength: number
  deliveryAddress: string
  phoneNumber: string
  onSuccess: () => void
  onCancel: () => void
  isProcessing: boolean
  setIsProcessing: (value: boolean) => void
  userId: string
  cart: any[]
  driverCommissionFixed: number
  onDeliveryAddressChange: (value: string) => void
  onPhoneNumberChange: (value: string) => void
}

export default function CheckoutForm({
  total,
  subtotal,
  deliveryFee,
  tax,
  cartLength,
  deliveryAddress,
  phoneNumber,
  onSuccess,
  onCancel,
  isProcessing,
  setIsProcessing,
  userId,
  cart,
  driverCommissionFixed,
  onDeliveryAddressChange,
  onPhoneNumberChange
}: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [stripeLoading, setStripeLoading] = useState(true)

  useEffect(() => {
    if (stripe && elements) {
      setStripeLoading(false)
    }
  }, [stripe, elements])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    if (!deliveryAddress.trim()) {
      toast.error('Please enter a delivery address')
      return
    }

    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number')
      return
    }

    setIsProcessing(true)
    setPaymentError(null)

    try {
      // First, create a temporary order to get order ID
      const tempOrderResponse = await fetch('/api/orders/create-temp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: userId,
          sellerId: cart[0].product.sellerId,
          items: cart,
          total,
          deliveryAddress: deliveryAddress.trim(),
          orderPhoneNumber: phoneNumber.trim(),
          deliveryCharge: deliveryFee,
          driverCommission: driverCommissionFixed
        })
      })

      if (!tempOrderResponse.ok) {
        throw new Error('Failed to create order')
      }

      const { orderId } = await tempOrderResponse.json()

      // Create payment intent
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          orderId,
          userId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create payment intent')
      }

      const { clientSecret, paymentIntentId } = await response.json()

      // Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          }
        }
      )

      if (confirmError) {
        setPaymentError(confirmError.message || 'Payment failed')
        setIsProcessing(false)
        return
      }

      if (paymentIntent?.status === 'succeeded') {
        // Confirm payment on server
        const confirmResponse = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId,
            orderId
          })
        })

        if (!confirmResponse.ok) {
          throw new Error('Failed to confirm payment')
        }

        toast.success('Payment successful! Order placed.')
        onSuccess()
      } else {
        throw new Error('Payment was not successful')
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      setPaymentError(error.message || 'Payment failed. Please try again.')
      toast.error(error.message || 'Payment failed. Please try again.')
      setIsProcessing(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Delivery Address *
        </label>
        <textarea
          value={deliveryAddress}
          onChange={(e) => onDeliveryAddressChange(e.target.value)}
          className="input h-24 resize-none"
          placeholder="Enter your complete delivery address"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number *
        </label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => onPhoneNumberChange(e.target.value)}
          className="input"
          placeholder="Enter your phone number"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <CreditCardIcon className="h-5 w-5 inline mr-1" />
          Payment Information *
        </label>
        {stripeLoading ? (
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <p className="text-sm text-gray-500">Loading payment form...</p>
          </div>
        ) : !stripe || !elements ? (
          <div className="border border-red-300 rounded-lg p-4 bg-red-50">
            <p className="text-sm text-red-600">
              Payment system not available. Please check your Stripe configuration.
            </p>
          </div>
        ) : (
          <div className="border border-gray-300 rounded-lg p-4 bg-white">
            <CardElement options={cardElementOptions} />
          </div>
        )}
        {paymentError && (
          <p className="text-red-600 text-sm mt-2">{paymentError}</p>
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Items ({cartLength})</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span>{deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{formatPrice(tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 btn btn-outline"
          disabled={isProcessing}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 btn btn-primary"
          disabled={isProcessing || !stripe}
        >
          {isProcessing ? 'Processing...' : `Pay ${formatPrice(total)}`}
        </button>
      </div>
    </form>
  )
}

