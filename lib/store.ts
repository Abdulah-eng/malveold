import { create } from 'zustand'
import { User, Product, CartItem, Order } from './types'
import { 
  getProducts, 
  addToCart as addToCartDB, 
  removeFromCart as removeFromCartDB, 
  updateCartItem,
  clearCart as clearCartDB,
  getCartItems,
  getOrders,
  getAvailableOrdersForDriver,
  createOrder as createOrderDB,
  updateOrderStatus as updateOrderStatusDB,
  assignDriverToOrder,
  createProduct as addProductDB,
  updateProduct as updateProductDB,
  deleteProduct as deleteProductDB
} from './database-client'

interface AppState {
  user: User | null
  cart: CartItem[]
  orders: Order[]
  availableOrders: Order[]
  products: Product[]
  isAuthenticated: boolean
  loading: boolean
  
  // Actions
  setUser: (user: User | null) => void
  loadProducts: () => Promise<void>
  loadCart: (userId: string) => Promise<void>
  loadOrders: (userId: string) => Promise<void>
  loadAvailableOrders: () => Promise<void>
  addToCart: (product: Product, quantity: number) => Promise<void>
  removeFromCart: (productId: string) => Promise<void>
  updateCartQuantity: (productId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => Promise<void>
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>
  claimOrder: (orderId: string) => Promise<void>
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<void>
  deleteProduct: (productId: string) => Promise<void>
  logout: () => void
}

export const useStore = create<AppState>()((set, get) => ({
      user: null,
      cart: [],
      orders: [],
      availableOrders: [],
      products: [],
      isAuthenticated: false,
      loading: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      loadProducts: async () => {
        set({ loading: true })
        try {
          const products = await getProducts()
          set({ products, loading: false })
        } catch (error) {
          console.error('Error loading products:', error)
          set({ loading: false })
        }
      },
      
      loadCart: async (userId) => {
        try {
          const cartItems = await getCartItems(userId)
          set({ cart: cartItems })
        } catch (error) {
          console.error('Error loading cart:', error)
        }
      },
      
      loadOrders: async (userId) => {
        try {
          const orders = await getOrders(userId)
          set({ orders })
        } catch (error) {
          console.error('Error loading orders:', error)
        }
      },

      loadAvailableOrders: async () => {
        try {
          const orders = await getAvailableOrdersForDriver()
          set({ availableOrders: orders })
        } catch (error) {
          console.error('Error loading available orders:', error)
        }
      },
      
      addToCart: async (product, quantity) => {
        const { user } = get()
        console.log('Store addToCart, user from store:', user)
        if (!user) {
          console.error('No user in store state')
          return
        }
        
        try {
          console.log('Calling addToCartDB')
          await addToCartDB(user.id, product.id, quantity)
          console.log('addToCartDB complete, loading cart')
          await get().loadCart(user.id)
        } catch (error) {
          console.error('Error adding to cart:', error)
        }
      },
      
      removeFromCart: async (productId) => {
        const { user } = get()
        if (!user) return
        
        try {
          await removeFromCartDB(user.id, productId)
          await get().loadCart(user.id)
        } catch (error) {
          console.error('Error removing from cart:', error)
        }
      },
      
      updateCartQuantity: async (productId, quantity) => {
        const { user } = get()
        if (!user) return
        
        try {
          await updateCartItem(user.id, productId, quantity)
          await get().loadCart(user.id)
        } catch (error) {
          console.error('Error updating cart quantity:', error)
        }
      },
      
      clearCart: async () => {
        const { user } = get()
        if (!user) return
        
        try {
          await clearCartDB(user.id)
          set({ cart: [] })
        } catch (error) {
          console.error('Error clearing cart:', error)
        }
      },
      
      addOrder: async (order) => {
        const { user } = get()
        if (!user) return
        
        try {
          await createOrderDB(order)
          await get().loadOrders(user.id)
          await get().clearCart()
        } catch (error) {
          console.error('Error creating order:', error)
        }
      },
      
      updateOrderStatus: async (orderId, status) => {
        try {
          await updateOrderStatusDB(orderId, status)
          const { user } = get()
          if (user) {
            await get().loadOrders(user.id)
          }
          // Refresh available list too
          await get().loadAvailableOrders()
        } catch (error) {
          console.error('Error updating order status:', error)
        }
      },

      // Driver claims an order
      claimOrder: async (orderId: string) => {
        const { user } = get()
        if (!user) return
        try {
          await assignDriverToOrder(orderId, user.id)
          await get().loadOrders(user.id)
          await get().loadAvailableOrders()
        } catch (error) {
          console.error('Error claiming order:', error)
        }
      },
      
      addProduct: async (product) => {
        try {
          await addProductDB(product)
          await get().loadProducts()
        } catch (error) {
          console.error('Error adding product:', error)
        }
      },
      
      updateProduct: async (productId, updates) => {
        try {
          await updateProductDB(productId, updates)
          await get().loadProducts()
        } catch (error) {
          console.error('Error updating product:', error)
        }
      },
      
      deleteProduct: async (productId) => {
        try {
          await deleteProductDB(productId)
          await get().loadProducts()
        } catch (error) {
          console.error('Error deleting product:', error)
        }
      },
      
      logout: () => set({ user: null, isAuthenticated: false, cart: [], orders: [] }),
    })
)
