import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'

// Webhook handler for Stripe events.
// Used to sync order payment_status when Stripe fires events
// (covers edge cases where the client never receives the confirmPayment result).
export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  // Use service role to bypass RLS for order updates
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      // Update order if it exists with this payment intent (created client-side)
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: 'paid', status: 'confirmed' })
        .eq('payment_intent_id', paymentIntent.id)
        .in('payment_status', ['pending', 'authorized']) // Only update non-final states

      if (error) {
        console.error('Failed to update order on payment_intent.succeeded:', error)
      }
      break
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: 'failed', status: 'cancelled' })
        .eq('payment_intent_id', paymentIntent.id)
        .eq('payment_status', 'pending')

      if (error) {
        console.error('Failed to update order on payment_intent.payment_failed:', error)
      }
      break
    }

    default:
      // Unhandled event type — silently ignore
      break
  }

  return NextResponse.json({ received: true })
}
