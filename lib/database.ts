import { supabase } from './supabase'
import { User, Product, CartItem, Order } from './types'

// User/Profile functions
export const getUserProfile = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data as User
}

export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<User | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating user profile:', error)
    return null
  }

  return data as User
}

// Product functions
export const getProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data as Product[]
}

export const getProductById = async (productId: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return null
  }

  return data as Product
}

export const createProduct = async (product: Omit<Product, 'id' | 'createdAt'>): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single()

  if (error) {
    console.error('Error creating product:', error)
    return null
  }

  return data as Product
}

export const updateProduct = async (productId: string, updates: Partial<Product>): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .select()
    .single()

  if (error) {
    console.error('Error updating product:', error)
    return null
  }

  return data as Product
}

export const deleteProduct = async (productId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  if (error) {
    console.error('Error deleting product:', error)
    return false
  }

  return true
}

// Cart functions
export const getCartItems = async (userId: string): Promise<CartItem[]> => {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      *,
      product:products(*)
    `)
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching cart items:', error)
    return []
  }

  return data.map(item => ({
    product: item.product as Product,
    quantity: item.quantity
  }))
}

export const addToCart = async (userId: string, productId: string, quantity: number): Promise<boolean> => {
  const { error } = await supabase
    .from('cart_items')
    .upsert({
      user_id: userId,
      product_id: productId,
      quantity: quantity
    })

  if (error) {
    console.error('Error adding to cart:', error)
    return false
  }

  return true
}

export const updateCartItem = async (userId: string, productId: string, quantity: number): Promise<boolean> => {
  if (quantity <= 0) {
    return await removeFromCart(userId, productId)
  }

  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('user_id', userId)
    .eq('product_id', productId)

  if (error) {
    console.error('Error updating cart item:', error)
    return false
  }

  return true
}

export const removeFromCart = async (userId: string, productId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)

  if (error) {
    console.error('Error removing from cart:', error)
    return false
  }

  return true
}

export const clearCart = async (userId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)

  if (error) {
    console.error('Error clearing cart:', error)
    return false
  }

  return true
}

// Order functions
export const getOrders = async (userId: string): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(
        *,
        product:products(*)
      )
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId},driver_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
    return []
  }

  return data.map(order => ({
    ...order,
    items: order.order_items.map((item: any) => ({
      product: item.product as Product,
      quantity: item.quantity
    }))
  })) as Order[]
}

export const createOrder = async (order: Omit<Order, 'id' | 'createdAt'>): Promise<Order | null> => {
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      buyer_id: order.buyerId,
      seller_id: order.sellerId,
      driver_id: order.driverId,
      total: order.total,
      status: order.status,
      delivery_address: order.deliveryAddress,
      estimated_delivery: order.estimatedDelivery,
      driver_location: order.driverLocation
    })
    .select()
    .single()

  if (orderError) {
    console.error('Error creating order:', orderError)
    return null
  }

  // Insert order items
  const orderItems = order.items.map(item => ({
    order_id: orderData.id,
    product_id: item.product.id,
    quantity: item.quantity,
    price: item.product.price
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    console.error('Error creating order items:', itemsError)
    return null
  }

  return {
    ...orderData,
    id: orderData.id,
    buyerId: orderData.buyer_id,
    sellerId: orderData.seller_id,
    driverId: orderData.driver_id,
    deliveryAddress: orderData.delivery_address,
    estimatedDelivery: orderData.estimated_delivery,
    driverLocation: orderData.driver_location,
    createdAt: orderData.created_at,
    items: order.items
  } as Order
}

export const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<boolean> => {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) {
    console.error('Error updating order status:', error)
    return false
  }

  return true
}

export const assignDriverToOrder = async (orderId: string, driverId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('orders')
    .update({ driver_id: driverId })
    .eq('id', orderId)

  if (error) {
    console.error('Error assigning driver to order:', error)
    return false
  }

  return true
}
