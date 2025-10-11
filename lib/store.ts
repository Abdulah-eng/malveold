import { create } from 'zustand'
import { sampleProducts } from './sample-data'
import { User, Product, CartItem, Order } from './types'

interface AppState {
  user: User | null
  cart: CartItem[]
  orders: Order[]
  products: Product[]
  isAuthenticated: boolean
  
  // Actions
  setUser: (user: User | null) => void
  addToCart: (product: Product, quantity: number) => void
  removeFromCart: (productId: string) => void
  updateCartQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  addOrder: (order: Order) => void
  updateOrderStatus: (orderId: string, status: Order['status']) => void
  addProduct: (product: Product) => void
  updateProduct: (productId: string, updates: Partial<Product>) => void
  deleteProduct: (productId: string) => void
  logout: () => void
}

export const useStore = create<AppState>()((set, get) => ({
      user: null,
      cart: [],
      orders: [],
      products: sampleProducts,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      addToCart: (product, quantity) => {
        const { cart } = get()
        const existingItem = cart.find(item => item.product.id === product.id)
        
        if (existingItem) {
          set({
            cart: cart.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          })
        } else {
          set({ cart: [...cart, { product, quantity }] })
        }
      },
      
      removeFromCart: (productId) => {
        const { cart } = get()
        set({ cart: cart.filter(item => item.product.id !== productId) })
      },
      
      updateCartQuantity: (productId, quantity) => {
        const { cart } = get()
        if (quantity <= 0) {
          set({ cart: cart.filter(item => item.product.id !== productId) })
        } else {
          set({
            cart: cart.map(item =>
              item.product.id === productId
                ? { ...item, quantity }
                : item
            )
          })
        }
      },
      
      clearCart: () => set({ cart: [] }),
      
      addOrder: (order) => {
        const { orders } = get()
        set({ orders: [...orders, order] })
      },
      
      updateOrderStatus: (orderId, status) => {
        const { orders } = get()
        set({
          orders: orders.map(order =>
            order.id === orderId ? { ...order, status } : order
          )
        })
      },
      
      addProduct: (product) => {
        const { products } = get()
        set({ products: [...products, product] })
      },
      
      updateProduct: (productId, updates) => {
        const { products } = get()
        set({
          products: products.map(product =>
            product.id === productId ? { ...product, ...updates } : product
          )
        })
      },
      
      deleteProduct: (productId) => {
        const { products } = get()
        set({ products: products.filter(product => product.id !== productId) })
      },
      
      logout: () => set({ user: null, isAuthenticated: false, cart: [] }),
    })
)
