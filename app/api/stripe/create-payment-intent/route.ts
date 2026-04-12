import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '@/lib/constants'

type CartItem = {
  price: number
  quantity: number
}

export async function POST(request: NextRequest) {
  try {
    const { cartItems } = (await request.json()) as { cartItems: CartItem[] }

    if (!cartItems?.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
    const shippingCost =
      subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
    const total = subtotal + shippingCost

    // Stripe requires amount in smallest currency unit (paisa for PKR: 1 PKR = 100 paisa)
    const amountInPaisa = Math.round(total * 100)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaisa,
      currency: 'pkr',
      automatic_payment_methods: { enabled: true },
    })

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
