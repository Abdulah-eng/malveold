import { createClient } from './supabase-client'
import { User, Product, CartItem, Order } from './types'

// Helpers to map between DB snake_case rows and app camelCase types
function mapProductRow(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    image: row.image,
    category: row.category,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    stock: row.stock,
    rating: row.rating,
    reviews: row.reviews,
    createdAt: row.created_at,
  }
}

function toProductInsert(product: Omit<Product, 'id' | 'createdAt'>) {
  return {
    name: product.name,
    description: product.description,
    price: product.price,
    image: product.image,
    category: product.category,
    seller_id: product.sellerId,
    seller_name: product.sellerName,
    stock: product.stock,
    rating: product.rating,
    reviews: product.reviews,
  }
}

function toProductUpdate(updates: Partial<Product>) {
  const mapped: any = {}
  if (updates.name !== undefined) mapped.name = updates.name
  if (updates.description !== undefined) mapped.description = updates.description
  if (updates.price !== undefined) mapped.price = updates.price
  if (updates.image !== undefined) mapped.image = updates.image
  if (updates.category !== undefined) mapped.category = updates.category
  if (updates.sellerId !== undefined) mapped.seller_id = updates.sellerId
  if (updates.sellerName !== undefined) mapped.seller_name = updates.sellerName
  if (updates.stock !== undefined) mapped.stock = updates.stock
  if (updates.rating !== undefined) mapped.rating = updates.rating
  if (updates.reviews !== undefined) mapped.reviews = updates.reviews
  return mapped
}

function mapOrderRow(row: any): Order {
  return {
    id: row.id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    driverId: row.driver_id ?? undefined,
    items: (row.order_items || []).map((item: any) => ({
      product: mapProductRow(item.product),
      quantity: item.quantity,
    })),
    total: row.total,
    status: row.status,
    deliveryAddress: row.delivery_address,
    createdAt: row.created_at,
    estimatedDelivery: row.estimated_delivery ?? undefined,
    driverLocation: row.driver_location ?? undefined,
  }
}

// User/Profile functions
export const getUserProfile = async (userId: string): Promise<User | null> => {
  const supabase = createClient()
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
  const supabase = createClient()
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
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return (data || []).map(mapProductRow)
}

export const getProductById = async (productId: string): Promise<Product | null> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return null
  }

  return data ? mapProductRow(data) : null
}

export const createProduct = async (product: Omit<Product, 'id' | 'createdAt'>): Promise<Product | null> => {
  const supabase = createClient()
  const productInsert = toProductInsert(product)
  console.log('Inserting product to DB:', productInsert)
  
  const { data, error } = await supabase
    .from('products')
    .insert(productInsert)
    .select('*')
    .single()

  console.log('Product insert result:', { data, error })

  if (error) {
    console.error('Error creating product:', error)
    return null
  }

  return data ? mapProductRow(data) : null
}

export const updateProduct = async (productId: string, updates: Partial<Product>): Promise<Product | null> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .update(toProductUpdate(updates))
    .eq('id', productId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating product:', error)
    return null
  }

  return data ? mapProductRow(data) : null
}

export const deleteProduct = async (productId: string): Promise<boolean> => {
  const supabase = createClient()
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
  const supabase = createClient()
  console.log('Fetching cart items for user:', userId)
  
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      *,
      product:products(*)
    `)
    .eq('user_id', userId)

  console.log('Cart items result:', { data, error, count: data?.length })

  if (error) {
    console.error('Error fetching cart items:', error)
    return []
  }

  return (data || []).map(item => ({
    product: mapProductRow(item.product),
    quantity: item.quantity,
  }))
}

export const addToCart = async (userId: string, productId: string, quantity: number): Promise<boolean> => {
  const supabase = createClient()
  console.log('Adding to cart:', { userId, productId, quantity })
  
  const { data, error } = await supabase
    .from('cart_items')
    .upsert({
      user_id: userId,
      product_id: productId,
      quantity: quantity
    })
    .select()

  console.log('Add to cart result:', { data, error })

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

  const supabase = createClient()
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
  const supabase = createClient()
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
  const supabase = createClient()
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
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId},driver_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
    return []
  }

  return (data || []).map(mapOrderRow)
}

export const getAvailableOrdersForDriver = async (): Promise<Order[]> => {
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
    .is('driver_id', null)
    .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching available orders:', error)
    return []
  }

  return (data || []).map(mapOrderRow)
}

export const createOrder = async (order: Omit<Order, 'id' | 'createdAt'>): Promise<Order | null> => {
  const supabase = createClient()
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
    .select('*')
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
    id: orderData.id,
    buyerId: orderData.buyer_id,
    sellerId: orderData.seller_id,
    driverId: orderData.driver_id ?? undefined,
    total: orderData.total,
    status: orderData.status,
    deliveryAddress: orderData.delivery_address,
    createdAt: orderData.created_at,
    estimatedDelivery: orderData.estimated_delivery ?? undefined,
    driverLocation: orderData.driver_location ?? undefined,
    // reflect the items we just inserted
    items: order.items,
  }
}

export const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<boolean> => {
  const supabase = createClient()
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
  const supabase = createClient()
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
