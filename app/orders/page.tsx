'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '../../lib/auth-context'
import { useStore } from '../../lib/store'
import { 
  EyeIcon,
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PhoneIcon
} from '@heroicons/react/24/outline'
import { formatPrice, formatDate, getOrderStatusColor, getOrderStatusText } from '../../lib/utils'

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const { user } = useAuth()
  const { orders, loadOrders } = useStore()

  useEffect(() => {
    if (user) {
      loadOrders(user.id)
    }
  }, [user, loadOrders])

  const userOrders = orders.filter(order => order.buyerId === user?.id)
  const activeOrders = userOrders.filter(order => 
    ['pending', 'confirmed', 'preparing', 'ready', 'picked_up'].includes(order.status)
  )
  const completedOrders = userOrders.filter(order => order.status === 'delivered')

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'confirmed':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />
      case 'preparing':
        return <ClockIcon className="h-5 w-5 text-orange-500" />
      case 'ready':
        return <TruckIcon className="h-5 w-5 text-purple-500" />
      case 'picked_up':
        return <TruckIcon className="h-5 w-5 text-indigo-500" />
      case 'delivered':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Your order is being processed'
      case 'confirmed':
        return 'Order confirmed, preparing items'
      case 'preparing':
        return 'Items are being prepared'
      case 'ready':
        return 'Order is ready for pickup'
      case 'picked_up':
        return 'Driver is on the way'
      case 'delivered':
        return 'Order has been delivered'
      case 'cancelled':
        return 'Order was cancelled'
      default:
        return 'Order status unknown'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600">Track your orders and delivery status</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Orders</p>
                <p className="text-2xl font-bold text-gray-900">{activeOrders.length}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedOrders.length}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TruckIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{userOrders.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">Active Orders</h2>
            <div className="space-y-4">
              {activeOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(order.status)}
                      <div>
                        <h3 className="font-semibold">Order #{order.id.slice(-6)}</h3>
                        <p className="text-sm text-gray-600">{getStatusDescription(order.status)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary-600">
                        {formatPrice(order.total)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      <span>{order.deliveryAddress}</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="btn btn-outline text-sm"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                      
                      {order.status === 'picked_up' && (
                        <button className="btn btn-outline text-sm">
                          <PhoneIcon className="h-4 w-4 mr-1" />
                          Call Driver
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>Ordered</span>
                      <span>Confirmed</span>
                      <span>Preparing</span>
                      <span>Ready</span>
                      <span>Picked Up</span>
                      <span>Delivered</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: order.status === 'pending' ? '16%' :
                                 order.status === 'confirmed' ? '33%' :
                                 order.status === 'preparing' ? '50%' :
                                 order.status === 'ready' ? '66%' :
                                 order.status === 'picked_up' ? '83%' :
                                 order.status === 'delivered' ? '100%' : '0%'
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Orders */}
        {completedOrders.length > 0 && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-6">Order History</h2>
            <div className="space-y-4">
              {completedOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      <div>
                        <h3 className="font-semibold">Order #{order.id.slice(-6)}</h3>
                        <p className="text-sm text-gray-600">Delivered on {formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary-600">
                        {formatPrice(order.total)}
                      </div>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="btn btn-outline text-sm mt-2"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {userOrders.length === 0 && (
          <div className="text-center py-12">
            <TruckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-8">Start shopping to see your orders here</p>
            <Link href="/" className="btn btn-primary">
              Start Shopping
            </Link>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Order Details</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Order ID</h4>
                    <p className="text-gray-600">#{selectedOrder.id.slice(-6)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOrderStatusColor(selectedOrder.status)}`}>
                      {getOrderStatusText(selectedOrder.status)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Order Date</h4>
                    <p className="text-gray-600">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Total</h4>
                    <p className="text-gray-600 font-semibold">{formatPrice(selectedOrder.total)}</p>
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Delivery Address</h4>
                  <div className="flex items-start">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <p className="text-gray-600">{selectedOrder.deliveryAddress}</p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Items</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item: any, index: number) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          width={60}
                          height={60}
                          className="w-15 h-15 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h5 className="font-medium">{item.product.name}</h5>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatPrice(item.product.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tracking */}
                {selectedOrder.status === 'picked_up' && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Live Tracking</h4>
                    <p className="text-blue-700 text-sm">
                      Your driver is on the way! You can track their location in real-time.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
