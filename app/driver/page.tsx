'use client'

import { useState, useEffect } from 'react'
import { useStore } from '../../lib/store'
import { 
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline'
import { formatPrice, getOrderStatusColor, getOrderStatusText } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function DriverDashboard() {
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const { user, orders, availableOrders, loadOrders, loadAvailableOrders, updateOrderStatus, claimOrder } = useStore()

  // Get available orders (not assigned to any driver)
  useEffect(() => {
    if (!user) return
    loadOrders(user.id)
    loadAvailableOrders()
  }, [user, loadOrders, loadAvailableOrders])

  // Get driver's assigned orders
  const driverOrders = orders.filter(order => 
    order.driverId === user?.id
  )

  const totalEarnings = driverOrders
    .filter(order => order.status === 'delivered')
    .reduce((sum, order) => sum + (order.total * 0.1), 0) // 10% commission

  const pendingDeliveries = driverOrders.filter(order => 
    ['picked_up'].includes(order.status)
  ).length

  useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
          toast.error('Unable to get your location')
        }
      )
    }
  }, [])

  const handleAcceptOrder = async (orderId: string) => {
    if (!user) {
      toast.error('Please sign in first')
      return
    }
    await claimOrder(orderId)
    toast.success('Order accepted! Navigate to pickup location.')
    setSelectedOrder(null)
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
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(totalEarnings)}</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Orders */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-6">Available Orders</h2>
            
            {availableOrders.length === 0 ? (
              <div className="text-center py-8">
                <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No available orders at the moment</p>
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
                    
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      <span>{order.deliveryAddress}</span>
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
                    
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      <span>{order.deliveryAddress}</span>
                    </div>
                    
                    {order.status === 'ready' && (
                      <button
                        onClick={() => handleStartDelivery(order.id)}
                        className="w-full btn btn-primary text-sm"
                      >
                        Start Delivery
                      </button>
                    )}
                    {order.status === 'picked_up' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleCompleteDelivery(order.id)}
                          className="flex-1 btn btn-primary text-sm"
                        >
                          Mark Delivered
                        </button>
                        <button className="btn btn-outline text-sm">
                          <PhoneIcon className="h-4 w-4 mr-1" />
                          Call
                        </button>
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
    </div>
  )
}
