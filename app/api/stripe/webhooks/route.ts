import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'

/**
 * Stripe webhook handler.
 *
 * Reconciles order payment_status with Stripe's view of the world. Two
 * sources can flip a 'pending' order to 'confirmed': the client's
 * post-charge `markOrderPaid` server action and this webhook. Both call
 * the same `mark_order_paid` RPC, which is idempotent — only the first
 * caller actually mutates the row.
 *
 * Idempotency at the event level is enforced by inserting `event.id` into
 * `stripe_events` first; duplicate deliveries return 200 immediately.
 */
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

  // Service role for writes — bypasses RLS for orders + stripe_events.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ── Idempotency: dedupe by event.id ────────────────────────────────────
  const { error: dupErr } = await supabase
    .from('stripe_events')
    .insert({ id: event.id, type: event.type })

  if (dupErr) {
    if (dupErr.code === '23505') {
      // Duplicate delivery — safe to acknowledge without re-processing.
      return NextResponse.json({ received: true, duplicate: true })
    }
    // Don't drop the event on other DB errors; log and continue. The handler
    // is still individually idempotent via mark_order_paid.
    console.error('stripe_events insert error:', dupErr)
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent
      const orderId = pi.metadata?.order_id

      if (orderId) {
        const { error } = await supabase.rpc('mark_order_paid', {
          p_order_id: orderId,
          p_payment_intent_id: pi.id,
        })
        if (error) {
          console.error('mark_order_paid (webhook) error:', error)
        }
      } else {
        // Legacy / unlinked PI — fall back to matching by payment_intent_id.
        const { error } = await supabase
          .from('orders')
          .update({ payment_status: 'paid', status: 'confirmed' })
          .eq('payment_intent_id', pi.id)
          .in('payment_status', ['pending', 'authorized'])
        if (error) {
          console.error('orders update by PI fallback error:', error)
        }
      }
      break
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent
      const orderId = pi.metadata?.order_id
      const reason =
        pi.last_payment_error?.message ?? 'Payment failed at Stripe'

      if (orderId) {
        const { error } = await supabase.rpc('mark_order_failed', {
          p_order_id: orderId,
          p_reason: 'Stripe: ' + reason,
        })
        if (error) {
          console.error('mark_order_failed (webhook) error:', error)
        }
      }
      break
    }

    default:
      // Unhandled event type — silently ignore.
      break
  }

  return NextResponse.json({ received: true })
}
