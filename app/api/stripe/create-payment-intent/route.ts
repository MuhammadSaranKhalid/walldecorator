import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db/client'
import { orders } from '@/lib/db/schema'

const requestSchema = z.object({
  orderId: z.uuid(),
})

/**
 * Creates a Stripe PaymentIntent for an EXISTING pending order.
 *
 * The order is created first by the `createOrder` server action; this route
 * looks up the canonical `total_amount` from the orders row, so neither the
 * cart contents nor the price ever round-trip through the client.
 */
export async function POST(request: NextRequest) {
  try {
    const json = await request.json().catch(() => null)
    const parsed = requestSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload' },
        { status: 400 }
      )
    }

    const { orderId } = parsed.data

    const order = await db.query.orders.findFirst({
      where: (o, { eq: e }) => e(o.id, orderId),
      columns: {
        id: true,
        order_number: true,
        total_amount: true,
        payment_status: true,
        status: true,
        payment_intent_id: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.payment_status !== 'pending' || order.status !== 'pending') {
      return NextResponse.json(
        { error: 'Order is not awaiting payment.' },
        { status: 409 }
      )
    }

    const totalPkr = Number(order.total_amount)
    const amountInPaisa = Math.round(totalPkr * 100)

    if (amountInPaisa < 1) {
      return NextResponse.json(
        { error: 'Order total is too small to process.' },
        { status: 400 }
      )
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaisa,
      currency: 'pkr',
      automatic_payment_methods: { enabled: true },
      statement_descriptor_suffix: 'WALLDECOR',
      metadata: {
        source: 'walldecorator',
        order_id: order.id,
        order_number: order.order_number,
      },
    })

    // Stamp the PI id onto the order so the webhook can reconcile by either
    // metadata.order_id OR payment_intent_id.
    await db
      .update(orders)
      .set({ payment_intent_id: paymentIntent.id })
      .where(eq(orders.id, order.id))

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
