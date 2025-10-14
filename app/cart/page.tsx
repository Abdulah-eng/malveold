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
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import { formatPrice, generateId } from '../../lib/utils'
import toast from 'react-hot-toast'

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

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  const deliveryFee = subtotal > 50 ? 0 : 5.99
  const tax = subtotal * 0.08
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

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.trim()) {
      toast.error('Please enter a delivery address')
      return
    }

    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number')
      return
    }

    setIsCheckingOut(true)

    try {
      // Create order
      const order = {
        buyerId: user!.id,
        sellerId: cart[0].product.sellerId, // Assuming all items from same seller
        items: [...cart],
        total,
        status: 'pending' as const,
        deliveryAddress: deliveryAddress.trim(),
        estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
      }

      await addOrder(order)
      setShowCheckoutModal(false)
      toast.success('Order placed successfully!')
      router.push('/orders')
    } catch (error) {
      toast.error('Checkout failed. Please try again.')
    } finally {
      setIsCheckingOut(false)
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

              {subtotal < 50 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Add {formatPrice(50 - subtotal)} more for free delivery!
                  </p>
                </div>
              )}

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

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Delivery Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Address *
                  </label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
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
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="input"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Items ({cart.length})</span>
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
                    onClick={() => setShowCheckoutModal(false)}
                    className="flex-1 btn btn-outline"
                    disabled={isCheckingOut}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    className="flex-1 btn btn-primary"
                    disabled={isCheckingOut}
                  >
                    {isCheckingOut ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
