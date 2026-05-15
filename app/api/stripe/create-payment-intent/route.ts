import { NextResponse } from 'next/server'

// Stripe disabled — payment processing removed.
// Restore from git history if Stripe is reintroduced.
export async function POST() {
  return NextResponse.json(
    { error: 'Payment processing is currently unavailable.' },
    { status: 410 }
  )
}

/*
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db/client'
import { orders } from '@/lib/db/schema'

const requestSchema = z.object({
  orderId: z.uuid(),
})

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
*/
