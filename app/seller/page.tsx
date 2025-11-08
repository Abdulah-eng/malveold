'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useStore } from '../../lib/store'
import { useAuth } from '../../lib/auth-context'
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  TruckIcon
} from '@heroicons/react/24/outline'
import { formatPrice, generateId, getOrderProgressPercentage, getOrderStatusText } from '../../lib/utils'
import toast from 'react-hot-toast'
import { getEarnings, createWithdrawalRequest } from '../../lib/database-client'

export default function SellerDashboard() {
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    image: ''
  })
  const { user: authUser } = useAuth()
  const { user, products, addProduct, updateProduct, deleteProduct, orders, updateOrderStatus, loadOrders, loadProducts } = useStore()
  const [earnings, setEarnings] = useState<{ available: number; pending: number; withdrawn: number }>({ available: 0, pending: 0, withdrawn: 0 })
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [withdrawalAmount, setWithdrawalAmount] = useState('')

  useEffect(() => {
    if (authUser) {
      loadProducts()
      loadOrders(authUser.id)
      loadEarnings()
    }
  }, [authUser, loadProducts, loadOrders])

  const loadEarnings = async () => {
    if (!authUser) return
    try {
      const earningsData = await getEarnings(authUser.id)
      setEarnings(earningsData)
    } catch (error) {
      console.error('Error loading earnings:', error)
    }
  }

  const handleWithdrawalRequest = async () => {
    if (!authUser) return
    
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
      await createWithdrawalRequest(authUser.id, 'seller', amount)
      toast.success('Withdrawal request submitted successfully!')
      setShowWithdrawalModal(false)
      setWithdrawalAmount('')
      await loadEarnings()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create withdrawal request')
    }
  }

  // Refresh orders periodically to see driver assignments
  useEffect(() => {
    if (!authUser) return
    
    const interval = setInterval(() => {
      loadOrders(authUser.id)
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [authUser, loadOrders])

  const sellerProducts = products.filter(p => p.sellerId === (user?.id || authUser?.id))
  const sellerOrders = orders.filter(o => o.sellerId === (user?.id || authUser?.id))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingProduct) {
      await updateProduct(editingProduct.id, {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        category: productForm.category,
        stock: parseInt(productForm.stock),
        image: productForm.image || '/placeholder-product.jpg'
      })
      toast.success('Product updated successfully!')
    } else {
      const newProduct = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        category: productForm.category,
        stock: parseInt(productForm.stock),
        image: productForm.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=300&fit=crop',
        sellerId: (user?.id || authUser?.id) || '',
        sellerName: (user?.name || authUser?.name) || '',
        rating: 0,
        reviews: 0,
      }
      console.log('Adding product:', newProduct)
      await addProduct(newProduct)
      console.log('Product added')
      toast.success('Product added successfully!')
    }
    
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: '',
      stock: '',
      image: ''
    })
    setShowAddProduct(false)
    setEditingProduct(null)
  }

  const handleEdit = (product: any) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      image: product.image
    })
    setShowAddProduct(true)
  }

  const handleDelete = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProduct(productId)
      toast.success('Product deleted successfully!')
    }
  }

  const totalRevenue = sellerOrders.reduce((sum, order) => sum + order.total, 0)
  const pendingOrders = sellerOrders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status)).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="text-gray-600">Manage your products and orders</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <ShoppingBagIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{sellerProducts.length}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(totalRevenue)}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TruckIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{pendingOrders}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{sellerOrders.length}</p>
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

        {/* Products Section */}
        <div className="card p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">My Products</h2>
            <button
              onClick={() => setShowAddProduct(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add Product</span>
            </button>
          </div>

          {sellerProducts.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBagIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No products yet</h3>
              <p className="text-gray-500 mb-4">Start by adding your first product</p>
              <button
                onClick={() => setShowAddProduct(true)}
                className="btn btn-primary"
              >
                Add Product
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sellerProducts.map((product) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <div className="relative mb-4">
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-primary-600">
                        {formatPrice(product.price)}
                      </span>
                      <span className="text-sm text-gray-500">Stock: {product.stock}</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 btn btn-outline flex items-center justify-center space-x-1"
                      >
                        <PencilIcon className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="flex-1 btn bg-red-600 text-white hover:bg-red-700 flex items-center justify-center space-x-1"
                      >
                        <TrashIcon className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-6">Recent Orders</h2>
          
          {sellerOrders.length === 0 ? (
            <div className="text-center py-8">
              <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sellerOrders.slice(0, 10).map((order) => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h3 className="font-semibold">Order #{order.id.slice(-6)}</h3>
                        <p className="text-sm text-gray-600">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''} • {formatPrice(order.total)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                        order.status === 'ready' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getOrderStatusText(order.status)}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>Pending</span>
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
                          width: `${getOrderProgressPercentage(order.status)}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex justify-end space-x-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={async () => {
                          try {
                            const success = await updateOrderStatus(order.id, 'confirmed')
                            if (success) {
                              toast.success('Order confirmed!')
                              // Reload orders to reflect the change
                              if (authUser) {
                                await loadOrders(authUser.id)
                              }
                            } else {
                              toast.error('Failed to confirm order. Please try again.')
                            }
                          } catch (error) {
                            console.error('Error confirming order:', error)
                            toast.error('Failed to confirm order. Please try again.')
                          }
                        }}
                        className="btn btn-primary text-sm"
                      >
                        Confirm Order
                      </button>
                    )}
                    {order.status === 'confirmed' && (
                      <button
                        onClick={async () => {
                          try {
                            const success = await updateOrderStatus(order.id, 'preparing')
                            if (success) {
                              toast.success('Order marked as preparing')
                              if (authUser) {
                                await loadOrders(authUser.id)
                              }
                            } else {
                              toast.error('Failed to update order. Please try again.')
                            }
                          } catch (error) {
                            console.error('Error updating order:', error)
                            toast.error('Failed to update order. Please try again.')
                          }
                        }}
                        className="btn btn-primary text-sm"
                      >
                        Start Preparing
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={async () => {
                          try {
                            const success = await updateOrderStatus(order.id, 'ready')
                            if (success) {
                              toast.success('Order ready for pickup!')
                              if (authUser) {
                                await loadOrders(authUser.id)
                              }
                            } else {
                              toast.error('Failed to mark order as ready. Please try again.')
                            }
                          } catch (error) {
                            console.error('Error updating order:', error)
                            toast.error('Failed to mark order as ready. Please try again.')
                          }
                        }}
                        className="btn btn-primary text-sm"
                      >
                        Mark Ready for Pickup
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <div className="flex items-center space-x-2">
                        {order.driverId ? (
                          <span className="text-sm text-green-600">✓ Driver assigned</span>
                        ) : (
                          <span className="text-sm text-gray-600">Waiting for driver to accept...</span>
                        )}
                      </div>
                    )}
                    {order.status === 'picked_up' && (
                      <span className="text-sm text-gray-600">Out for delivery</span>
                    )}
                    {order.status === 'delivered' && (
                      <span className="text-sm text-green-600">✓ Delivered</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                    className="input"
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    required
                    value={productForm.description}
                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                    className="input h-20 resize-none"
                    placeholder="Enter product description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={productForm.price}
                      onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                      className="input"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock
                    </label>
                    <input
                      type="number"
                      required
                      value={productForm.stock}
                      onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                      className="input"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    required
                    value={productForm.category}
                    onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                    className="input"
                  >
                    <option value="">Select category</option>
                    <option value="electronics">Electronics</option>
                    <option value="clothing">Clothing</option>
                    <option value="home">Home & Garden</option>
                    <option value="sports">Sports</option>
                    <option value="books">Books</option>
                    <option value="beauty">Beauty</option>
                    <option value="food">Food & Drinks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={productForm.image}
                    onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                    className="input"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddProduct(false)
                      setEditingProduct(null)
                      setProductForm({
                        name: '',
                        description: '',
                        price: '',
                        category: '',
                        stock: '',
                        image: ''
                      })
                    }}
                    className="flex-1 btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn btn-primary"
                  >
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </form>
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
