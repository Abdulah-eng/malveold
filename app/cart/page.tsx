'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/auth-context'
import { useStore } from '../../lib/store'
import { 
  TrashIcon,
  PlusIcon,
  MinusIcon,
  ShoppingBagIcon,
  ArrowLeftIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline'
import { formatPrice, generateId } from '../../lib/utils'
import toast from 'react-hot-toast'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import CheckoutForm from '../../components/CheckoutForm'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

// Check if Stripe key is configured
if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  console.warn('⚠️ Stripe publishable key is not configured. Please add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your .env.local file')
}

export default function CartPage() {
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const { user } = useAuth()
  const { cart, updateCartQuantity, removeFromCart, clearCart, addOrder, loadCart } = useStore()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      setDeliveryAddress(user.address || '')
      setPhoneNumber(user.phone || '')
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadCart(user.id)
    }
  }, [user, loadCart])

  const [taxPercentage, setTaxPercentage] = useState<number>(8)
  const [deliveryCharge, setDeliveryCharge] = useState<number>(5.99)
  const [driverCommissionFixed, setDriverCommissionFixed] = useState<number>(5.00)

  useEffect(() => {
    // Load settings from database
    const loadSettings = async () => {
      try {
        const { getBuyerTaxPercentage, getDeliveryCharge, getDriverCommissionFixed } = await import('../../lib/database-client')
        const [tax, delivery, commission] = await Promise.all([
          getBuyerTaxPercentage(),
          getDeliveryCharge(),
          getDriverCommissionFixed()
        ])
        setTaxPercentage(tax)
        setDeliveryCharge(delivery)
        setDriverCommissionFixed(commission)
      } catch (error) {
        console.error('Error loading settings:', error)
        // Use defaults if settings can't be loaded
        setTaxPercentage(8)
        setDeliveryCharge(5.99)
        setDriverCommissionFixed(5.00)
      }
    }
    loadSettings()
  }, [])

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  const deliveryFee = deliveryCharge
  const tax = subtotal * (taxPercentage / 100)
  const total = subtotal + deliveryFee + tax

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeFromCart(productId)
    } else {
      await updateCartQuantity(productId, newQuantity)
    }
  }

  const handleCheckout = () => {
    if (!user) {
      toast.error('Please sign in to continue')
      router.push('/login')
      return
    }

    if (cart.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    setShowCheckoutModal(true)
  }

  const handlePaymentSuccess = async () => {
    try {
      // Reload orders and clear cart
      if (user) {
        await loadCart(user.id)
      }
      setShowCheckoutModal(false)
      router.push('/orders')
    } catch (error) {
      console.error('Error after payment success:', error)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <ShoppingBagIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Add some items to get started</p>
            <Link href="/" className="btn btn-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Continue Shopping
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-6">
                Cart Items ({cart.length})
              </h2>
              
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="relative">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        width={80}
                        height={80}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.product.name}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2">{item.product.description}</p>
                      <p className="text-sm text-gray-500">by {item.product.sellerName}</p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary-600">
                        {formatPrice(item.product.price * item.quantity)}
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-2">
                        <button
                          onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                          className="p-1 rounded-full hover:bg-gray-100"
                        >
                          <MinusIcon className="h-4 w-4" />
                        </button>
                        
                        <span className="w-8 text-center">{item.quantity}</span>
                        
                        <button
                          onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                          className="p-1 rounded-full hover:bg-gray-100"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="mt-2 text-red-600 hover:text-red-800 text-sm flex items-center"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>
                    {deliveryFee === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      formatPrice(deliveryFee)
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>


              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full btn btn-primary mt-6 py-3"
              >
                Proceed to Checkout
              </button>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Secure checkout with SSL encryption
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal with Stripe */}
      {showCheckoutModal && user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Checkout</h3>
                <button
                  onClick={() => setShowCheckoutModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isCheckingOut}
                >
                  ✕
                </button>
              </div>
              
              <Elements stripe={stripePromise}>
                <CheckoutForm
                  total={total}
                  subtotal={subtotal}
                  deliveryFee={deliveryFee}
                  tax={tax}
                  cartLength={cart.length}
                  deliveryAddress={deliveryAddress}
                  phoneNumber={phoneNumber}
                  onSuccess={handlePaymentSuccess}
                  onCancel={() => setShowCheckoutModal(false)}
                  isProcessing={isCheckingOut}
                  setIsProcessing={setIsCheckingOut}
                  userId={user.id}
                  cart={cart}
                  driverCommissionFixed={driverCommissionFixed}
                  onDeliveryAddressChange={setDeliveryAddress}
                  onPhoneNumberChange={setPhoneNumber}
                />
              </Elements>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
