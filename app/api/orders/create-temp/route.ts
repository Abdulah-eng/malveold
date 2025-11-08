import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-client'
import { createOrder } from '@/lib/database-client'

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json()

    // Verify user is authenticated
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user || user.id !== orderData.buyerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create order with pending payment status
    const order = {
      ...orderData,
      status: 'pending' as const,
      paymentStatus: 'pending' as const,
      estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    }

    const createdOrder = await createOrder(order)

    if (!createdOrder) {
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    return NextResponse.json({ orderId: createdOrder.id })
  } catch (error: any) {
    console.error('Error creating temp order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    )
  }
}

