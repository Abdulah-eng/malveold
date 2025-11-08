'use client'

import { useState, useEffect } from 'react'
import { useStore } from '../../lib/store'
import { useAuth } from '../../lib/auth-context'
import { 
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline'
import { formatPrice, getOrderStatusColor, getOrderStatusText, getOrderProgressPercentage } from '../../lib/utils'
import toast from 'react-hot-toast'
import { getEarnings, createWithdrawalRequest } from '../../lib/database-client'

export default function DriverDashboard() {
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const { user: authUser } = useAuth()
  const { user, orders, availableOrders, loadOrders, loadAvailableOrders, updateOrderStatus, claimOrder, setUser } = useStore()
  const [earnings, setEarnings] = useState<{ available: number; pending: number; withdrawn: number }>({ available: 0, pending: 0, withdrawn: 0 })
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  
  // Sync auth user to store if needed
  useEffect(() => {
    if (authUser && (!user || user.id !== authUser.id)) {
      setUser(authUser)
    }
  }, [authUser, user, setUser])

  // Get available orders (not assigned to any driver)
  useEffect(() => {
    const currentUser = user || authUser
    if (!currentUser) return
    loadOrders(currentUser.id)
    loadAvailableOrders()
    loadEarnings()
  }, [user, authUser, loadOrders, loadAvailableOrders])

  const loadEarnings = async () => {
    const currentUser = user || authUser
    if (!currentUser) return
    try {
      const earningsData = await getEarnings(currentUser.id)
      setEarnings(earningsData)
    } catch (error) {
      console.error('Error loading earnings:', error)
    }
  }

  const handleWithdrawalRequest = async () => {
    const currentUser = user || authUser
    if (!currentUser) return
    
    const amount = parseFloat(withdrawalAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (amount > earnings.available) {
      toast.error('Insufficient earnings')
      return
    }

    try {
      await createWithdrawalRequest(currentUser.id, 'driver', amount)
      toast.success('Withdrawal request submitted successfully!')
      setShowWithdrawalModal(false)
      setWithdrawalAmount('')
      await loadEarnings()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create withdrawal request')
    }
  }

  // Refresh orders periodically
  useEffect(() => {
    const currentUser = user || authUser
    if (!currentUser) return
    
    const interval = setInterval(() => {
      loadOrders(currentUser.id)
      loadAvailableOrders()
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [user, authUser, loadOrders, loadAvailableOrders])

  // Get driver's assigned orders
  const currentUser = user || authUser
  const driverOrders = orders.filter(order => 
    order.driverId === currentUser?.id
  )

  // Earnings are now tracked in the database, not calculated from orders

  const pendingDeliveries = driverOrders.filter(order => 
    ['picked_up'].includes(order.status)
  ).length

  useEffect(() => {
    // Get current location (optional - don't show error if denied)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          // Only log to console, don't show error toast
          // Location is optional for the app to work
          console.log('Location access:', error.code === 1 ? 'denied by user' : 'unavailable')
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000 // Cache for 5 minutes
        }
      )
    }
  }, [])

  const handleAcceptOrder = async (orderId: string) => {
    const currentUser = user || authUser
    if (!currentUser) {
      toast.error('Please sign in first')
      return
    }
    try {
      await claimOrder(orderId)
      toast.success('Order accepted! Navigate to pickup location.')
      setSelectedOrder(null)
      // Refresh orders
      await loadOrders(currentUser.id)
      await loadAvailableOrders()
    } catch (error) {
      console.error('Error accepting order:', error)
      toast.error('Failed to accept order. Please try again.')
    }
  }

  const handleStartDelivery = async (orderId: string) => {
    await updateOrderStatus(orderId, 'picked_up')
    toast.success('Delivery started! Customer will be notified.')
  }

  const handleCompleteDelivery = async (orderId: string) => {
    await updateOrderStatus(orderId, 'delivered')
    toast.success('Delivery completed! Payment will be processed.')
  }

  const handleRejectOrder = (orderId: string) => {
    setSelectedOrder(null)
    toast.error('Order rejected')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Driver Dashboard</h1>
          <p className="text-gray-600">Manage your deliveries and earnings</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Earnings</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(earnings.available)}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TruckIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">{pendingDeliveries}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Orders</p>
                <p className="text-2xl font-bold text-gray-900">{availableOrders.length}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {driverOrders.filter(o => o.status === 'delivered').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Section */}
        <div className="card p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">My Earnings</h2>
            <button
              onClick={() => setShowWithdrawalModal(true)}
              disabled={earnings.available <= 0}
              className="btn btn-primary"
            >
              Request Withdrawal
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold text-green-600">{formatPrice(earnings.available)}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Pending Withdrawal</p>
              <p className="text-2xl font-bold text-yellow-600">{formatPrice(earnings.pending)}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Total Withdrawn</p>
              <p className="text-2xl font-bold text-blue-600">{formatPrice(earnings.withdrawn)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Orders */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Available Orders</h2>
              <button
                onClick={async () => {
                  const currentUser = user || authUser
                  if (currentUser) {
                    await loadOrders(currentUser.id)
                    await loadAvailableOrders()
                    toast.success('Orders refreshed')
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Refresh
              </button>
            </div>
            
            {availableOrders.length === 0 ? (
              <div className="text-center py-8">
                <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No available orders at the moment</p>
                <p className="text-sm text-gray-400 mb-2">
                  Orders will appear here when sellers mark them as "Ready for Pickup"
                </p>
                {process.env.NODE_ENV === 'development' && currentUser && (
                  <p className="text-xs text-gray-400 mt-2">
                    Debug: Logged in as {currentUser.name} ({currentUser.role})
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {availableOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">Order #{order.id.slice(-6)}</h3>
                        <p className="text-sm text-gray-600">
                          {order.items.length} items • {formatPrice(order.total)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getOrderStatusColor(order.status)}`}>
                        {getOrderStatusText(order.status)}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      {/* Delivery Address (Buyer) */}
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="font-medium">Delivery:</span>
                        <span className="ml-1">{order.deliveryAddress}</span>
                      </div>
                      
                      {/* Buyer Contact Info */}
                      <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                        <div className="text-xs font-semibold text-gray-700 mb-1">Buyer Contact:</div>
                        <div className="flex items-center text-sm text-gray-700">
                          <PhoneIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                          {order.orderPhoneNumber ? (
                            <a 
                              href={`tel:${order.orderPhoneNumber}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {order.orderPhoneNumber}
                            </a>
                          ) : order.buyerPhone ? (
                            <a 
                              href={`tel:${order.buyerPhone}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {order.buyerPhone}
                            </a>
                          ) : (
                            <span className="text-gray-400 italic">Phone not available</span>
                          )}
                          {order.buyerName && (
                            <span className="ml-2 text-gray-500">({order.buyerName})</span>
                          )}
                        </div>
                        {order.buyerEmail && (
                          <div className="flex items-center text-sm text-gray-700">
                            <EnvelopeIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                            <a 
                              href={`mailto:${order.buyerEmail}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {order.buyerEmail}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Seller Contact Info */}
                      <div className="bg-green-50 p-3 rounded-lg space-y-2">
                        <div className="text-xs font-semibold text-gray-700 mb-1">Pickup Location (Seller):</div>
                        {order.sellerAddress && (
                          <div className="flex items-center text-sm text-gray-700">
                            <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                            <span>{order.sellerAddress}</span>
                          </div>
                        )}
                        {order.sellerPhone && (
                          <div className="flex items-center text-sm text-gray-700">
                            <PhoneIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                            <a 
                              href={`tel:${order.sellerPhone}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {order.sellerPhone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="flex-1 btn btn-outline text-sm"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                      <button
                        onClick={() => handleAcceptOrder(order.id)}
                        className="flex-1 btn btn-primary text-sm"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Deliveries */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-6">My Deliveries</h2>
            
            {driverOrders.length === 0 ? (
              <div className="text-center py-8">
                <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No assigned deliveries</p>
              </div>
            ) : (
              <div className="space-y-4">
                {driverOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">Order #{order.id.slice(-6)}</h3>
                        <p className="text-sm text-gray-600">
                          {order.items.length} items • {formatPrice(order.total)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getOrderStatusColor(order.status)}`}>
                        {getOrderStatusText(order.status)}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      {/* Delivery Address (Buyer) */}
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="font-medium">Delivery:</span>
                        <span className="ml-1">{order.deliveryAddress}</span>
                      </div>
                      
                      {/* Buyer Contact Info */}
                      <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                        <div className="text-xs font-semibold text-gray-700 mb-1">Buyer Contact:</div>
                        <div className="flex items-center text-sm text-gray-700">
                          <PhoneIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                          {order.orderPhoneNumber ? (
                            <a 
                              href={`tel:${order.orderPhoneNumber}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {order.orderPhoneNumber}
                            </a>
                          ) : order.buyerPhone ? (
                            <a 
                              href={`tel:${order.buyerPhone}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {order.buyerPhone}
                            </a>
                          ) : (
                            <span className="text-gray-400 italic">Phone not available</span>
                          )}
                          {order.buyerName && (
                            <span className="ml-2 text-gray-500">({order.buyerName})</span>
                          )}
                        </div>
                        {order.buyerEmail && (
                          <div className="flex items-center text-sm text-gray-700">
                            <EnvelopeIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                            <a 
                              href={`mailto:${order.buyerEmail}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {order.buyerEmail}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Seller Contact Info */}
                      <div className="bg-green-50 p-3 rounded-lg space-y-2">
                        <div className="text-xs font-semibold text-gray-700 mb-1">Pickup Location (Seller):</div>
                        {order.sellerAddress && (
                          <div className="flex items-center text-sm text-gray-700">
                            <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                            <span>{order.sellerAddress}</span>
                          </div>
                        )}
                        {order.sellerPhone && (
                          <div className="flex items-center text-sm text-gray-700">
                            <PhoneIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                            <a 
                              href={`tel:${order.sellerPhone}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {order.sellerPhone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 mb-4">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span>Ready</span>
                        <span>Picked Up</span>
                        <span>Delivered</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: order.status === 'ready' ? '33%' :
                                   order.status === 'picked_up' ? '66%' :
                                   order.status === 'delivered' ? '100%' : '0%'
                          }}
                        />
                      </div>
                    </div>
                    
                    {order.status === 'ready' && (
                      <button
                        onClick={async () => {
                          await handleStartDelivery(order.id)
                        }}
                        className="w-full btn btn-primary text-sm"
                      >
                        Start Delivery
                      </button>
                    )}
                    {order.status === 'picked_up' && (
                      <button
                        onClick={async () => {
                          await handleCompleteDelivery(order.id)
                        }}
                        className="w-full btn btn-primary text-sm"
                      >
                        Mark Delivered
                      </button>
                    )}
                    {order.status === 'delivered' && (
                      <div className="text-center text-sm text-green-600">
                        ✓ Delivery Completed
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Location Status */}
        {currentLocation && (
          <div className="card p-6 mt-8">
            <h2 className="text-xl font-semibold mb-4">Location Status</h2>
            <div className="flex items-center text-green-600">
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              <span>GPS tracking active</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Your location is being shared with customers for real-time tracking
            </p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Order Details</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Order #{selectedOrder.id.slice(-6)}</h4>
                  <p className="text-sm text-gray-600">
                    {selectedOrder.items.length} items • {formatPrice(selectedOrder.total)}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Items:</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.product.name} x{item.quantity}</span>
                        <span>{formatPrice(item.product.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedOrder.driverCommission !== undefined && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Your Commission:</span>
                      <span className="text-green-600 font-bold text-lg">{formatPrice(selectedOrder.driverCommission)}</span>
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium text-gray-900">Delivery Address:</h4>
                  <p className="text-sm text-gray-600">{selectedOrder.deliveryAddress}</p>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      handleAcceptOrder(selectedOrder.id)
                      setSelectedOrder(null)
                    }}
                    className="flex-1 btn btn-primary"
                  >
                    Accept Order
                  </button>
                  <button
                    onClick={() => {
                      handleRejectOrder(selectedOrder.id)
                      setSelectedOrder(null)
                    }}
                    className="flex-1 btn btn-outline"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Request Modal */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Request Withdrawal</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Available Earnings
                  </label>
                  <p className="text-2xl font-bold text-green-600">{formatPrice(earnings.available)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Withdrawal Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={earnings.available}
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    className="input"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowWithdrawalModal(false)
                      setWithdrawalAmount('')
                    }}
                    className="flex-1 btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleWithdrawalRequest}
                    className="flex-1 btn btn-primary"
                  >
                    Submit Request
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
