import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase-client'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId, orderId } = await request.json()

    if (!paymentIntentId || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user is authenticated
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status === 'succeeded') {
      // Get order details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*, seller_id, driver_id, total, delivery_charge, driver_commission')
        .eq('id', orderId)
        .single()

      if (orderError || !orderData) {
        console.error('Error fetching order:', orderError)
        return NextResponse.json(
          { error: 'Failed to fetch order' },
          { status: 500 }
        )
      }

      // Update order payment status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          stripe_payment_intent_id: paymentIntentId,
        })
        .eq('id', orderId)

      if (updateError) {
        console.error('Error updating order payment status:', updateError)
        return NextResponse.json(
          { error: 'Failed to update order' },
          { status: 500 }
        )
      }

      // Create earnings records
      const { getSellerTaxPercentage, createEarnings } = await import('@/lib/database-client')
      const sellerTaxPercentage = await getSellerTaxPercentage()
      
      await createEarnings(
        orderId,
        orderData.seller_id,
        orderData.driver_id || undefined,
        parseFloat(orderData.total),
        parseFloat(orderData.delivery_charge || 0),
        parseFloat(orderData.driver_commission || 0),
        sellerTaxPercentage
      )

      return NextResponse.json({ success: true, status: 'paid' })
    }

    return NextResponse.json({
      success: false,
      status: paymentIntent.status,
    })
  } catch (error: any) {
    console.error('Error confirming payment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}

