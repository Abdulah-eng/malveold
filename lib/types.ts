export interface User {
  id: string
  name: string
  email: string
  role: 'buyer' | 'seller' | 'driver' | 'admin'
  avatar?: string
  phone?: string
  address?: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  sellerId: string
  sellerName: string
  stock: number
  rating: number
  reviews: number
  createdAt: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Order {
  id: string
  buyerId: string
  sellerId: string
  driverId?: string
  items: CartItem[]
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled'
  deliveryAddress: string
  createdAt: string
  estimatedDelivery?: string
  driverLocation?: {
    lat: number
    lng: number
  }
  buyerPhone?: string
  buyerName?: string
  buyerEmail?: string
  orderPhoneNumber?: string // Phone number provided during checkout
  sellerAddress?: string
  sellerPhone?: string
  deliveryCharge?: number // Delivery charge applied to the order
  driverCommission?: number // Fixed driver commission for the order
  paymentStatus?: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded'
  stripePaymentIntentId?: string
}

export interface Earnings {
  id: string
  userId: string
  userRole: 'seller' | 'driver'
  orderId: string
  amount: number
  status: 'pending' | 'available' | 'withdrawn'
  createdAt: string
  updatedAt: string
}

export interface WithdrawalRequest {
  id: string
  userId: string
  userRole: 'seller' | 'driver'
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  adminNotes?: string
  createdAt: string
  updatedAt: string
  processedAt?: string
  processedBy?: string
  userName?: string
  userEmail?: string
}
