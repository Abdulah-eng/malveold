'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { User, Order, Product, WithdrawalRequest } from '@/lib/types'
import { toast } from 'react-hot-toast'
import { getWithdrawalRequests, updateWithdrawalRequestStatus } from '@/lib/database-client'
import { 
  MagnifyingGlassIcon,
  XMarkIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { formatPrice, getOrderStatusColor, getOrderStatusText, getOrderProgressPercentage } from '@/lib/utils'

interface DashboardStats {
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  activeSellers: number
  activeDrivers: number
  pendingOrders: number
  completedOrders: number
}

interface OrderWithDetails extends Order {
  buyerName: string
  sellerName: string
  driverName?: string
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'orders' | 'products' | 'settings' | 'payments'>('dashboard')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [settings, setSettings] = useState<{[key: string]: string}>({
    buyer_tax_percentage: '8',
    driver_commission_percentage: '10',
    seller_tax_percentage: '5',
    driver_commission_fixed: '5.00',
    delivery_charge: '5.99'
  })
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null)
  const [adminNotes, setAdminNotes] = useState('')

  // Auto-refresh removed - admins can manually refresh if needed

  // Helper functions - must be defined before loadDashboardData
  const mapUserRow = (row: any): User & { createdAt?: string } => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatar: row.avatar,
    phone: row.phone,
    address: row.address,
    createdAt: row.created_at
  })

  const mapProductRow = (row: any): Product => ({
    id: row.id,
    name: row.name,
    description: row.description,
    price: parseFloat(row.price),
    image: row.image,
    category: row.category,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    stock: row.stock,
    rating: parseFloat(row.rating || 0),
    reviews: row.reviews || 0,
    createdAt: row.created_at
  })

  const mapOrderRow = (row: any): Order => {
    // Handle order_items - it might be an array or nested
    const orderItems = row.order_items || []
    
    return {
      id: row.id,
      buyerId: row.buyer_id,
      sellerId: row.seller_id,
      driverId: row.driver_id || undefined,
      items: orderItems
        .filter((item: any) => item && item.product) // Filter out null items
        .map((item: any) => ({
          product: {
            id: item.product?.id || item.product_id,
            name: item.product?.name || 'Unknown Product',
            description: item.product?.description || '',
            price: parseFloat(item.price || item.product?.price || 0),
            image: item.product?.image || '',
            category: item.product?.category || '',
            sellerId: item.product?.seller_id || row.seller_id || '',
            sellerName: item.product?.seller_name || '',
            stock: item.product?.stock || 0,
            rating: item.product?.rating || 0,
            reviews: item.product?.reviews || 0,
            createdAt: item.product?.created_at || ''
          },
          quantity: item.quantity || 0
        })),
      total: parseFloat(row.total || 0),
      status: row.status,
      deliveryAddress: row.delivery_address || '',
      createdAt: row.created_at,
      estimatedDelivery: row.estimated_delivery || undefined,
      driverLocation: row.driver_location || undefined
    }
  }

  const loadOrdersWithDetails = useCallback(async (): Promise<OrderWithDetails[]> => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            product:products(*)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading orders:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        toast.error('Failed to load orders: ' + error.message)
        return []
      }

      console.log('Raw orders data:', data?.length || 0, 'orders')

      if (!data || data.length === 0) {
        console.log('No orders found in database')
        return []
      }

      // Get user details for orders
      const orderIds = data?.map(o => o.id) || []
      const userIds = [...new Set([
        ...(data?.map(o => o.buyer_id) || []),
        ...(data?.map(o => o.seller_id) || []),
        ...(data?.map(o => o.driver_id).filter(Boolean) || [])
      ])]

      console.log('Fetching user data for', userIds.length, 'users')

      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds)

      if (userError) {
        console.error('Error loading user data:', userError)
      }

      const userMap = new Map(userData?.map(u => [u.id, u.name]) || [])
      console.log('User map size:', userMap.size)

      const mappedOrders = (data || []).map(order => {
        try {
          const mapped = mapOrderRow(order)
          return {
            ...mapped,
            buyerName: userMap.get(order.buyer_id) || 'Unknown',
            sellerName: userMap.get(order.seller_id) || 'Unknown',
            driverName: order.driver_id ? userMap.get(order.driver_id) : undefined
          }
        } catch (error) {
          console.error('Error mapping order:', order.id, error)
          console.error('Order data:', order)
          return null
        }
      }).filter((order): order is OrderWithDetails => order !== null)
      
      console.log('Successfully mapped orders:', mappedOrders.length)
      return mappedOrders
    } catch (error) {
      console.error('Unexpected error in loadOrdersWithDetails:', error)
      toast.error('Failed to load orders')
      return []
    }
  }, [])

  const loadSettings = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
      
      if (error) {
        console.error('Error loading settings:', error)
        return
      }

      const settingsMap: {[key: string]: string} = {}
      data?.forEach(setting => {
        settingsMap[setting.key] = setting.value
      })
      setSettings(settingsMap)
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }, [])

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      // Load dashboard stats
      const [usersResult, ordersResult, productsResult] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('orders').select('*'),
        supabase.from('products').select('*')
      ])

      if (usersResult.error) throw usersResult.error
      if (ordersResult.error) throw ordersResult.error

      const allUsers = usersResult.data || []
      const allOrders = ordersResult.data || []

      // Calculate stats
      const totalRevenue = allOrders
        .filter(order => order.status === 'delivered')
        .reduce((sum, order) => sum + parseFloat(order.total), 0)

      const dashboardStats: DashboardStats = {
        totalUsers: allUsers.length,
        totalOrders: allOrders.length,
        totalRevenue,
        activeSellers: allUsers.filter(u => u.role === 'seller').length,
        activeDrivers: allUsers.filter(u => u.role === 'driver').length,
        pendingOrders: allOrders.filter(o => o.status === 'pending').length,
        completedOrders: allOrders.filter(o => o.status === 'delivered').length
      }

      setStats(dashboardStats)
      setUsers(allUsers.map(mapUserRow))
      setOrders(await loadOrdersWithDetails())
      
      // Load products
      if (productsResult.data) {
        setProducts(productsResult.data.map(mapProductRow))
      }

      // Load settings
      await loadSettings()
      
      // Load withdrawal requests
      const requests = await getWithdrawalRequests()
      setWithdrawalRequests(requests)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [loadSettings, loadOrdersWithDetails])

  const loadWithdrawalRequests = async () => {
    try {
      const requests = await getWithdrawalRequests()
      setWithdrawalRequests(requests)
    } catch (error) {
      console.error('Error loading withdrawal requests:', error)
      toast.error('Failed to load withdrawal requests')
    }
  }

  const handleUpdateWithdrawalStatus = async (requestId: string, status: 'approved' | 'rejected' | 'paid') => {
    try {
      await updateWithdrawalRequestStatus(requestId, status, adminNotes || undefined)
      toast.success(`Withdrawal request ${status} successfully`)
      setSelectedRequest(null)
      setAdminNotes('')
      await loadWithdrawalRequests()
    } catch (error) {
      console.error('Error updating withdrawal request:', error)
      toast.error('Failed to update withdrawal request')
    }
  }

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/')
      return
    }
    if (user && user.role === 'admin') {
      loadDashboardData()
    }
  }, [user, router, loadDashboardData])

  const updateSetting = async (key: string, value: string) => {
    try {
      setSettingsLoading(true)
      const supabase = createClient()
      const { error } = await supabase
        .from('settings')
        .upsert({ key, value }, { onConflict: 'key' })

      if (error) throw error

      setSettings(prev => ({ ...prev, [key]: value }))
      toast.success('Setting updated successfully')
    } catch (error) {
      console.error('Error updating setting:', error)
      toast.error('Failed to update setting')
    } finally {
      setSettingsLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      toast.success('User role updated successfully')
      loadDashboardData()
    } catch (error) {
      console.error('Error updating user role:', error)
      toast.error('Failed to update user role')
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) {
        console.error('Error updating order status:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        toast.error('Failed to update order status: ' + error.message)
        return
      }

      toast.success('Order status updated successfully')
      // Reload orders to reflect the change
      setOrders(await loadOrdersWithDetails())
    } catch (error: any) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status: ' + (error?.message || 'Unknown error'))
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error

      toast.success('User deleted successfully')
      loadDashboardData()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      toast.success('Product deleted successfully')
      loadDashboardData()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    }
  }

  // Filter functions
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || user.role === filterRole
    return matchesSearch && matchesRole
  })

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.buyerName && order.buyerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.sellerName && order.sellerName.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sellerName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your marketplace platform</p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'dashboard', name: 'Dashboard Overview', icon: '📊' },
              { id: 'users', name: 'User Management', icon: '👥' },
              { id: 'orders', name: 'Order Management', icon: '📦' },
              { id: 'products', name: 'Product Management', icon: '🛍️' },
              { id: 'payments', name: 'Payments', icon: '💰' },
              { id: 'settings', name: 'Platform Settings', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any)
                  setSearchTerm('') // Reset search when switching tabs
                  setFilterRole('all')
                  setFilterStatus('all')
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Overview Tab */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">👥</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">📦</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalOrders}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">💰</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                        <dd className="text-lg font-medium text-gray-900">{formatPrice(stats.totalRevenue)}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">⏳</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Pending Orders</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.pendingOrders}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Role Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">User Roles</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Sellers</span>
                    <span className="text-sm font-medium text-gray-900">{stats.activeSellers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Drivers</span>
                    <span className="text-sm font-medium text-gray-900">{stats.activeDrivers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Buyers</span>
                    <span className="text-sm font-medium text-gray-900">{stats.totalUsers - stats.activeSellers - stats.activeDrivers}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Order Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="text-sm font-medium text-green-600">{stats.completedOrders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="text-sm font-medium text-yellow-600">{stats.pendingOrders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">In Progress</span>
                    <span className="text-sm font-medium text-blue-600">{stats.totalOrders - stats.completedOrders - stats.pendingOrders}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                  <p className="text-sm text-gray-600">Manage user accounts and roles</p>
                </div>
              </div>
              {/* Search and Filter */}
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full"
                  />
                </div>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="border border-gray-300 rounded-md px-4 py-2"
                >
                  <option value="all">All Roles</option>
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="driver">Driver</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'seller' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'driver' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.phone || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt || '').toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user.id, e.target.value)}
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                          >
                            <option value="buyer">Buyer</option>
                            <option value="seller">Seller</option>
                            <option value="driver">Driver</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete user"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Order Management Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Order Management</h3>
                  <p className="text-sm text-gray-600">Monitor and manage all orders</p>
                </div>
              </div>
              {/* Search and Filter */}
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search orders by ID, buyer, or seller..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-md px-4 py-2"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.buyerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.sellerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.driverName || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOrderStatusColor(order.status)}`}>
                          {getOrderStatusText(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View details"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="preparing">Preparing</option>
                            <option value="ready">Ready</option>
                            <option value="picked_up">Picked Up</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Product Management Tab */}
        {activeTab === 'products' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Product Management</h3>
                  <p className="text-sm text-gray-600">Manage all products in the marketplace</p>
                </div>
              </div>
              {/* Search */}
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products by name, category, or seller..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full"
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <Image
                                src={product.image}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-lg object-cover"
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.sellerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPrice(product.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <span className="text-yellow-500">★</span>
                            <span className="ml-1">{product.rating.toFixed(1)}</span>
                            <span className="ml-1 text-gray-500">({product.reviews})</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete product"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Withdrawal Requests</h3>
                  <p className="text-sm text-gray-600">Manage seller and driver withdrawal requests</p>
                </div>
                <button
                  onClick={loadWithdrawalRequests}
                  className="btn btn-outline"
                >
                  Refresh
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {withdrawalRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          No withdrawal requests found
                        </td>
                      </tr>
                    ) : (
                      withdrawalRequests.map((request) => (
                        <tr key={request.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{request.userName || 'Unknown'}</div>
                              <div className="text-sm text-gray-500">{request.userEmail || ''}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              request.userRole === 'seller' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {request.userRole}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatPrice(request.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              request.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                              request.status === 'paid' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {request.status === 'pending' && (
                              <button
                                onClick={() => {
                                  setSelectedRequest(request)
                                  setAdminNotes('')
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Review
                              </button>
                            )}
                            {request.status === 'approved' && (
                              <button
                                onClick={() => handleUpdateWithdrawalStatus(request.id, 'paid')}
                                className="text-green-600 hover:text-green-900"
                              >
                                Mark as Paid
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Platform Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Platform Settings</h3>
                <p className="text-sm text-gray-600">Configure tax rates and commission percentages</p>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Buyer Tax Percentage */}
              <div className="border rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-md font-semibold text-gray-900">Buyer Tax Percentage</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Tax percentage applied to buyer orders (e.g., 8 = 8%)
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.buyer_tax_percentage || '8'}
                    onChange={(e) => setSettings(prev => ({ ...prev, buyer_tax_percentage: e.target.value }))}
                    className="w-32 px-4 py-2 border border-gray-300 rounded-md"
                    placeholder="8"
                  />
                  <span className="text-gray-600">%</span>
                  <button
                    onClick={() => updateSetting('buyer_tax_percentage', settings.buyer_tax_percentage || '8')}
                    disabled={settingsLoading}
                    className="btn btn-primary"
                  >
                    {settingsLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Example:</strong> If a buyer orders $100 worth of products, 
                    with {settings.buyer_tax_percentage || '8'}% tax, they will pay ${(100 * (1 + parseFloat(settings.buyer_tax_percentage || '8') / 100)).toFixed(2)} total.
                  </p>
                </div>
              </div>

              {/* Driver Commission Fixed Amount */}
              <div className="border rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-md font-semibold text-gray-900">Driver Commission (Fixed Amount)</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Fixed dollar amount that the driver receives per delivery (e.g., 5.00 = $5.00)
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-600">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.driver_commission_fixed || '5.00'}
                    onChange={(e) => setSettings(prev => ({ ...prev, driver_commission_fixed: e.target.value }))}
                    className="w-32 px-4 py-2 border border-gray-300 rounded-md"
                    placeholder="5.00"
                  />
                  <button
                    onClick={() => updateSetting('driver_commission_fixed', settings.driver_commission_fixed || '5.00')}
                    disabled={settingsLoading}
                    className="btn btn-primary"
                  >
                    {settingsLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Example:</strong> For every delivery, the driver will receive a fixed commission of ${parseFloat(settings.driver_commission_fixed || '5.00').toFixed(2)}.
                  </p>
                </div>
              </div>

              {/* Delivery Charge */}
              <div className="border rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-md font-semibold text-gray-900">Delivery Charge</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Fixed dollar amount charged to customers for delivery (e.g., 5.99 = $5.99)
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-600">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.delivery_charge || '5.99'}
                    onChange={(e) => setSettings(prev => ({ ...prev, delivery_charge: e.target.value }))}
                    className="w-32 px-4 py-2 border border-gray-300 rounded-md"
                    placeholder="5.99"
                  />
                  <button
                    onClick={() => updateSetting('delivery_charge', settings.delivery_charge || '5.99')}
                    disabled={settingsLoading}
                    className="btn btn-primary"
                  >
                    {settingsLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Example:</strong> Customers will be charged ${parseFloat(settings.delivery_charge || '5.99').toFixed(2)} for delivery on every order.
                  </p>
                </div>
              </div>

              {/* Seller Tax Percentage */}
              <div className="border rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-md font-semibold text-gray-900">Seller Tax Percentage</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Tax percentage applied to seller earnings (e.g., 5 = 5%)
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.seller_tax_percentage || '5'}
                    onChange={(e) => setSettings(prev => ({ ...prev, seller_tax_percentage: e.target.value }))}
                    className="w-32 px-4 py-2 border border-gray-300 rounded-md"
                    placeholder="5"
                  />
                  <span className="text-gray-600">%</span>
                  <button
                    onClick={() => updateSetting('seller_tax_percentage', settings.seller_tax_percentage || '5')}
                    disabled={settingsLoading}
                    className="btn btn-primary"
                  >
                    {settingsLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Example:</strong> If a seller earns $100 from an order, 
                    with {settings.seller_tax_percentage || '5'}% tax, 
                    they will receive ${(100 * (1 - parseFloat(settings.seller_tax_percentage || '5') / 100)).toFixed(2)} after tax.
                  </p>
                </div>
              </div>

              {/* Summary Card */}
              <div className="border rounded-lg p-6 bg-gray-50">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Calculation Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Subtotal:</span>
                    <span className="font-medium">$100.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Buyer Tax ({settings.buyer_tax_percentage || '8'}%):</span>
                    <span className="font-medium">${(100 * parseFloat(settings.buyer_tax_percentage || '8') / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Buyer Pays:</span>
                    <span className="font-semibold text-blue-600">${(100 * (1 + parseFloat(settings.buyer_tax_percentage || '8') / 100)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Charge:</span>
                    <span className="font-medium">${parseFloat(settings.delivery_charge || '5.99').toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Driver Commission (Fixed):</span>
                      <span className="font-medium text-green-600">${parseFloat(settings.driver_commission_fixed || '5.00').toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Seller Tax ({settings.seller_tax_percentage || '5'}%):</span>
                      <span className="font-medium text-red-600">-${(100 * parseFloat(settings.seller_tax_percentage || '5') / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-gray-600">Seller Receives:</span>
                      <span className="font-semibold text-purple-600">
                        ${(100 - parseFloat(settings.driver_commission_fixed || '5.00') - (100 * parseFloat(settings.seller_tax_percentage || '5') / 100)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Withdrawal Request Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Review Withdrawal Request</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">User</p>
                  <p className="font-medium">{selectedRequest.userName} ({selectedRequest.userEmail})</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Role</p>
                  <p className="font-medium capitalize">{selectedRequest.userRole}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-medium text-lg">{formatPrice(selectedRequest.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Request Date</p>
                  <p className="font-medium">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="input h-24 resize-none"
                    placeholder="Add notes about this withdrawal..."
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setSelectedRequest(null)
                      setAdminNotes('')
                    }}
                    className="flex-1 btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdateWithdrawalStatus(selectedRequest.id, 'rejected')}
                    className="flex-1 btn btn-outline text-red-600 border-red-600 hover:bg-red-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleUpdateWithdrawalStatus(selectedRequest.id, 'approved')}
                    className="flex-1 btn btn-primary"
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Order Details</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Order ID</h4>
                    <p className="text-gray-600 text-sm">{selectedOrder.id}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOrderStatusColor(selectedOrder.status)}`}>
                      {getOrderStatusText(selectedOrder.status)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Buyer</h4>
                    <p className="text-gray-600 text-sm">{selectedOrder.buyerName}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Seller</h4>
                    <p className="text-gray-600 text-sm">{selectedOrder.sellerName}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Driver</h4>
                    <p className="text-gray-600 text-sm">{selectedOrder.driverName || 'Unassigned'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Total</h4>
                    <p className="text-gray-600 font-semibold">{formatPrice(selectedOrder.total)}</p>
                  </div>
                  {selectedOrder.deliveryCharge !== undefined && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Delivery Charge</h4>
                      <p className="text-gray-600 text-sm">{formatPrice(selectedOrder.deliveryCharge)}</p>
                    </div>
                  )}
                  {selectedOrder.driverCommission !== undefined && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Driver Commission</h4>
                      <p className="text-gray-600 text-sm text-green-600 font-semibold">{formatPrice(selectedOrder.driverCommission)}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Order Date</h4>
                    <p className="text-gray-600 text-sm">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Delivery Address</h4>
                    <p className="text-gray-600 text-sm">{selectedOrder.deliveryAddress}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Order Progress</h4>
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
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${getOrderProgressPercentage(selectedOrder.status)}%`
                      }}
                    />
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Order Items</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
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
                          <p className="text-sm text-gray-500">{formatPrice(item.product.price)} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
