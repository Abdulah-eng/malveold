import { createClient } from './supabase-client'
import { User, Product, CartItem, Order, Earnings, WithdrawalRequest } from './types'

// Settings functions
export const getSettings = async (): Promise<{[key: string]: string}> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
  
  if (error) {
    console.error('Error fetching settings:', error)
    return {
      buyer_tax_percentage: '8',
      driver_commission_percentage: '10',
      seller_tax_percentage: '5',
      driver_commission_fixed: '5.00',
      delivery_charge: '5.99'
    }
  }

  const settingsMap: {[key: string]: string} = {}
  data?.forEach(setting => {
    settingsMap[setting.key] = setting.value
  })
  
  return settingsMap
}

export const getBuyerTaxPercentage = async (): Promise<number> => {
  const settings = await getSettings()
  return parseFloat(settings.buyer_tax_percentage || '8')
}

export const getDriverCommissionPercentage = async (): Promise<number> => {
  const settings = await getSettings()
  return parseFloat(settings.driver_commission_percentage || '10')
}

export const getSellerTaxPercentage = async (): Promise<number> => {
  const settings = await getSettings()
  return parseFloat(settings.seller_tax_percentage || '5')
}

export const getDriverCommissionFixed = async (): Promise<number> => {
  const settings = await getSettings()
  return parseFloat(settings.driver_commission_fixed || '5.00')
}

export const getDeliveryCharge = async (): Promise<number> => {
  const settings = await getSettings()
  return parseFloat(settings.delivery_charge || '5.99')
}

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
  // Handle buyer and seller data - they might come as objects or arrays
  const buyer = row.buyer || (Array.isArray(row.buyer) ? row.buyer[0] : null)
  const seller = row.seller || (Array.isArray(row.seller) ? row.seller[0] : null)
  
  return {
    id: row.id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    driverId: row.driver_id ?? undefined,
    items: (row.order_items || [])
      .filter((item: any) => item.product) // Filter out items with null products
      .map((item: any) => ({
        product: mapProductRow(item.product),
        quantity: item.quantity,
      })),
    total: parseFloat(row.total) || 0,
    status: row.status,
    deliveryAddress: row.delivery_address || '',
    createdAt: row.created_at,
    estimatedDelivery: row.estimated_delivery ?? undefined,
    driverLocation: row.driver_location ?? undefined,
    buyerPhone: buyer?.phone || undefined,
    buyerName: buyer?.name || undefined,
    buyerEmail: buyer?.email || undefined,
    orderPhoneNumber: row.order_phone_number || undefined, // Phone number provided during checkout
    sellerAddress: seller?.address || undefined,
    sellerPhone: seller?.phone || undefined,
    deliveryCharge: row.delivery_charge ? parseFloat(row.delivery_charge) : undefined,
    driverCommission: row.driver_commission ? parseFloat(row.driver_commission) : undefined,
    paymentStatus: row.payment_status || 'pending',
    stripePaymentIntentId: row.stripe_payment_intent_id || undefined,
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
    .gt('stock', 0) // Only get products with stock > 0
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
      ),
      buyer:profiles!orders_buyer_id_fkey(phone, name, email),
      seller:profiles!orders_seller_id_fkey(phone, name, address)
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId},driver_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
    return []
  }

  // Debug: Log the raw data to see buyer info
  if (process.env.NODE_ENV === 'development' && data && data.length > 0) {
    console.log('Raw order data sample:', JSON.stringify(data[0], null, 2))
  }

  // If buyer or seller data is missing, fetch it separately
  const orders = (data || []).map(mapOrderRow)
  // Fetch buyer and seller data for orders that are missing info
  const ordersNeedingData = orders.filter(o => 
    !o.buyerPhone || !o.buyerName || !o.buyerEmail || !o.sellerAddress || !o.sellerPhone
  )
  
  if (ordersNeedingData.length > 0) {
    const buyerIds = Array.from(new Set(ordersNeedingData.map(o => o.buyerId)))
    const sellerIds = Array.from(new Set(ordersNeedingData.map(o => o.sellerId)))
    const allUserIds = Array.from(new Set([...buyerIds, ...sellerIds]))
    
    const { data: userData } = await supabase
      .from('profiles')
      .select('id, phone, name, email, address')
      .in('id', allUserIds)
    
    if (userData) {
      const userMap = new Map(userData.map(u => [u.id, u]))
      orders.forEach(order => {
        const buyer = userMap.get(order.buyerId)
        const seller = userMap.get(order.sellerId)
        
        if (buyer) {
          if (!order.buyerPhone) order.buyerPhone = buyer.phone || undefined
          if (!order.buyerName) order.buyerName = buyer.name || undefined
          if (!order.buyerEmail) order.buyerEmail = buyer.email || undefined
        }
        
        if (seller) {
          if (!order.sellerAddress) order.sellerAddress = seller.address || undefined
          if (!order.sellerPhone) order.sellerPhone = seller.phone || undefined
        }
      })
    }
  }

  return orders
}

export const getAvailableOrdersForDriver = async (): Promise<Order[]> => {
  const supabase = createClient()
  
  // Check if user is authenticated and is a driver
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    console.error('No active session found')
    return []
  }

  // Verify user is a driver
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'driver') {
    console.error('User is not a driver')
    return []
  }

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(
        *,
        product:products(*)
      ),
      buyer:profiles!orders_buyer_id_fkey(phone, name, email),
      seller:profiles!orders_seller_id_fkey(phone, name, address)
    `)
    .is('driver_id', null)
    .eq('status', 'ready') // Drivers should only see orders that are ready for pickup
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching available orders:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    return []
  }

  console.log('Available orders fetched:', data?.length || 0)
  
  // Map orders and fetch buyer/seller data if missing
  const orders = (data || []).map(mapOrderRow)
  const ordersNeedingData = orders.filter(o => 
    !o.buyerPhone || !o.buyerName || !o.buyerEmail || !o.sellerAddress || !o.sellerPhone
  )
  
  if (ordersNeedingData.length > 0) {
    const buyerIds = Array.from(new Set(ordersNeedingData.map(o => o.buyerId)))
    const sellerIds = Array.from(new Set(ordersNeedingData.map(o => o.sellerId)))
    const allUserIds = Array.from(new Set([...buyerIds, ...sellerIds]))
    
    const { data: userData } = await supabase
      .from('profiles')
      .select('id, phone, name, email, address')
      .in('id', allUserIds)
    
    if (userData) {
      const userMap = new Map(userData.map(u => [u.id, u]))
      orders.forEach(order => {
        const buyer = userMap.get(order.buyerId)
        const seller = userMap.get(order.sellerId)
        
        if (buyer) {
          if (!order.buyerPhone) order.buyerPhone = buyer.phone || undefined
          if (!order.buyerName) order.buyerName = buyer.name || undefined
          if (!order.buyerEmail) order.buyerEmail = buyer.email || undefined
        }
        
        if (seller) {
          if (!order.sellerAddress) order.sellerAddress = seller.address || undefined
          if (!order.sellerPhone) order.sellerPhone = seller.phone || undefined
        }
      })
    }
  }
  
  return orders
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
      order_phone_number: order.orderPhoneNumber,
      estimated_delivery: order.estimatedDelivery,
      driver_location: order.driverLocation,
      delivery_charge: order.deliveryCharge || 0,
      driver_commission: order.driverCommission || 0,
      payment_status: order.paymentStatus || 'pending',
      stripe_payment_intent_id: order.stripePaymentIntentId
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

  // Decrease stock for each product in the order
  for (const item of order.items) {
    try {
      // Get current stock
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product.id)
        .single()

      if (productError) {
        console.error(`Error fetching stock for product ${item.product.id}:`, productError)
        console.error('Product error details:', {
          message: productError.message,
          code: productError.code,
          details: productError.details
        })
        continue
      }

      const currentStock = productData?.stock || 0
      const newStock = Math.max(0, currentStock - item.quantity)

      console.log(`Updating stock for product ${item.product.id}: ${currentStock} -> ${newStock} (quantity: ${item.quantity})`)

      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', item.product.id)

      if (stockError) {
        console.error(`Error updating stock for product ${item.product.id}:`, stockError)
        console.error('Stock error details:', {
          message: stockError.message,
          code: stockError.code,
          details: stockError.details,
          hint: stockError.hint
        })
        // Continue with other products even if one fails
      } else {
        console.log(`Successfully updated stock for product ${item.product.id}`)
      }
    } catch (error) {
      console.error(`Unexpected error updating stock for product ${item.product.id}:`, error)
    }
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
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    console.error('No active session found')
    return false
  }
  
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()

  if (error) {
    console.error('Error updating order status:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    return false
  }

  if (!data || data.length === 0) {
    console.error('No rows updated - order may not exist or user may not have permission')
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

// Earnings functions
export const createEarnings = async (orderId: string, sellerId: string, driverId: string | undefined, orderTotal: number, deliveryCharge: number, driverCommission: number, sellerTaxPercentage: number): Promise<boolean> => {
  const supabase = createClient()
  
  try {
    // Calculate seller earnings (order total - delivery charge - driver commission - seller tax)
    const sellerEarnings = orderTotal - deliveryCharge - driverCommission - (orderTotal * sellerTaxPercentage / 100)
    
    // Create seller earnings
    const { error: sellerError } = await supabase
      .from('earnings')
      .insert({
        user_id: sellerId,
        user_role: 'seller',
        order_id: orderId,
        amount: sellerEarnings,
        status: 'available'
      })

    if (sellerError) {
      console.error('Error creating seller earnings:', sellerError)
      return false
    }

    // Create driver earnings if driver is assigned
    if (driverId && driverCommission > 0) {
      const { error: driverError } = await supabase
        .from('earnings')
        .insert({
          user_id: driverId,
          user_role: 'driver',
          order_id: orderId,
          amount: driverCommission,
          status: 'available'
        })

      if (driverError) {
        console.error('Error creating driver earnings:', driverError)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error creating earnings:', error)
    return false
  }
}

export const getEarnings = async (userId: string): Promise<{ available: number; pending: number; withdrawn: number }> => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('earnings')
    .select('amount, status')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching earnings:', error)
    return { available: 0, pending: 0, withdrawn: 0 }
  }

  const available = (data || [])
    .filter(e => e.status === 'available')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0)
  
  const pending = (data || [])
    .filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0)
  
  const withdrawn = (data || [])
    .filter(e => e.status === 'withdrawn')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0)

  return { available, pending, withdrawn }
}

// Withdrawal request functions
export const createWithdrawalRequest = async (userId: string, userRole: 'seller' | 'driver', amount: number): Promise<WithdrawalRequest | null> => {
  const supabase = createClient()
  
  // Get available earnings
  const earnings = await getEarnings(userId)
  
  if (earnings.available < amount) {
    throw new Error('Insufficient earnings')
  }

  // Create withdrawal request
  const { data, error } = await supabase
    .from('withdrawal_requests')
    .insert({
      user_id: userId,
      user_role: userRole,
      amount: amount,
      status: 'pending'
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating withdrawal request:', error)
    return null
  }

  // Mark earnings as withdrawn (mark as many as needed to cover the withdrawal amount)
  // We'll mark earnings in order of creation until we've covered the withdrawal amount
  let remainingAmount = amount
  const { data: availableEarnings, error: earningsFetchError } = await supabase
    .from('earnings')
    .select('id, amount')
    .eq('user_id', userId)
    .eq('status', 'available')
    .order('created_at', { ascending: true })

  if (earningsFetchError) {
    console.error('Error fetching earnings:', earningsFetchError)
  } else if (availableEarnings) {
    for (const earning of availableEarnings) {
      if (remainingAmount <= 0) break
      const earningAmount = parseFloat(earning.amount)
      const amountToMark = Math.min(earningAmount, remainingAmount)
      
      // If the earning amount is less than or equal to remaining, mark the whole earning
      if (earningAmount <= remainingAmount) {
        const { error: updateError } = await supabase
          .from('earnings')
          .update({ status: 'withdrawn' })
          .eq('id', earning.id)
        
        if (updateError) {
          console.error('Error updating earnings status:', updateError)
        } else {
          remainingAmount -= earningAmount
        }
      }
    }
  }

  return {
    id: data.id,
    userId: data.user_id,
    userRole: data.user_role,
    amount: parseFloat(data.amount),
    status: data.status,
    adminNotes: data.admin_notes || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    processedAt: data.processed_at || undefined,
    processedBy: data.processed_by || undefined
  }
}

export const getWithdrawalRequests = async (userId?: string): Promise<WithdrawalRequest[]> => {
  const supabase = createClient()
  
  let query = supabase
    .from('withdrawal_requests')
    .select(`
      *,
      user:profiles!withdrawal_requests_user_id_fkey(id, name, email)
    `)
    .order('created_at', { ascending: false })

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching withdrawal requests:', error)
    return []
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    userRole: row.user_role,
    amount: parseFloat(row.amount),
    status: row.status,
    adminNotes: row.admin_notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    processedAt: row.processed_at || undefined,
    processedBy: row.processed_by || undefined,
    userName: row.user?.name || undefined,
    userEmail: row.user?.email || undefined
  }))
}

export const updateWithdrawalRequestStatus = async (requestId: string, status: 'approved' | 'rejected' | 'paid', adminNotes?: string): Promise<boolean> => {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase
    .from('withdrawal_requests')
    .update({
      status,
      admin_notes: adminNotes,
      processed_at: status === 'paid' ? new Date().toISOString() : undefined,
      processed_by: user.id
    })
    .eq('id', requestId)

  if (error) {
    console.error('Error updating withdrawal request:', error)
    return false
  }

  return true
}
