import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { inArray, eq, and } from 'drizzle-orm'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db/client'
import { product_variants, products } from '@/lib/db/schema'
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '@/lib/constants'

const cartItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive().max(99),
})

const requestSchema = z.object({
  cartItems: z.array(cartItemSchema).min(1),
})

export async function POST(request: NextRequest) {
  try {
    const json = await request.json().catch(() => null)
    const parsed = requestSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid cart payload' },
        { status: 400 }
      )
    }

    const { cartItems } = parsed.data

    // Look up authoritative prices server-side. The client-sent price is
    // intentionally NOT trusted — only variantId + quantity.
    const variantIds = cartItems.map((i) => i.variantId)
    const variantRows = await db
      .select({
        id: product_variants.id,
        price: product_variants.price,
      })
      .from(product_variants)
      .innerJoin(products, eq(products.id, product_variants.product_id))
      .where(
        and(
          inArray(product_variants.id, variantIds),
          eq(products.status, 'active')
        )
      )

    if (variantRows.length !== variantIds.length) {
      return NextResponse.json(
        { error: 'One or more items in your cart are unavailable. Please refresh your cart.' },
        { status: 400 }
      )
    }

    const priceByVariant = new Map(
      variantRows.map((row) => [row.id, Number(row.price)])
    )

    const subtotal = cartItems.reduce((sum, item) => {
      const unitPrice = priceByVariant.get(item.variantId) ?? 0
      return sum + unitPrice * item.quantity
    }, 0)

    const shippingCost =
      subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
    const total = subtotal + shippingCost

    // Stripe requires amount in smallest currency unit (paisa for PKR)
    const amountInPaisa = Math.round(total * 100)

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
        item_count: cartItems.length.toString(),
        subtotal: subtotal.toString(),
      },
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
