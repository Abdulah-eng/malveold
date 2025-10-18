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
}
