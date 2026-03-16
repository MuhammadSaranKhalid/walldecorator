'use server'

import { db } from '@/lib/db/client'
import { eq, and, sql } from 'drizzle-orm'
import { orders, order_items } from '@/lib/db/schema'

export type OrderItem = {
  id: string
  product_name: string
  variant_description: string | null
  sku: string
  quantity: number
  unit_price: number
  total_price: number
}

export type TrackOrderResult =
  | {
      found: false
      error: string
    }
  | {
      found: true
      order_number: string
      status: string
      payment_status: string
      customer_name: string
      shipping_address: {
        line1: string
        line2?: string | null
        city: string
        province: string
        postal_code: string
        country: string
      }
      items: OrderItem[]
      subtotal: number
      shipping_cost: number
      total_amount: number
      created_at: string
      confirmed_at: string | null
      shipped_at: string | null
      delivered_at: string | null
    }

/**
 * Look up an order by order number + email for the track-order page.
 * Matches on both fields to prevent order enumeration.
 */
export async function trackOrder(
  orderNumber: string,
  email: string
): Promise<TrackOrderResult> {
  const sanitizedOrder = orderNumber.trim().toUpperCase()
  const sanitizedEmail = email.trim().toLowerCase()

  if (!sanitizedOrder || !sanitizedEmail) {
    return { found: false, error: 'Please enter both an order number and email address.' }
  }

  try {
    const order = await db.query.orders.findFirst({
      where: (o, { eq, and, sql }) =>
        and(
          eq(o.order_number, sanitizedOrder),
          // Case-insensitive email match
          sql`LOWER(${o.customer_email}) = ${sanitizedEmail}`
        ),
      columns: {
        order_number: true,
        status: true,
        payment_status: true,
        customer_name: true,
        shipping_address: true,
        subtotal: true,
        shipping_cost: true,
        total_amount: true,
        created_at: true,
        confirmed_at: true,
        shipped_at: true,
        delivered_at: true,
      },
      with: {
        order_items: {
          columns: {
            id: true,
            product_name: true,
            variant_description: true,
            sku: true,
            quantity: true,
            unit_price: true,
            total_price: true,
          },
        },
      },
    })

    if (!order) {
      return {
        found: false,
        error: 'No order found with that order number and email. Please check your details and try again.',
      }
    }

    const address = order.shipping_address as {
      line1: string
      line2?: string | null
      city: string
      province: string
      postal_code: string
      country: string
    }

    return {
      found: true,
      order_number: order.order_number,
      status: order.status ?? 'pending',
      payment_status: order.payment_status ?? 'pending',
      customer_name: order.customer_name,
      shipping_address: address,
      items: order.order_items.map((item) => ({
        ...item,
        unit_price: Number(item.unit_price),
        total_price: Number(item.total_price),
      })),
      subtotal: Number(order.subtotal),
      shipping_cost: Number(order.shipping_cost ?? 0),
      total_amount: Number(order.total_amount),
      created_at: order.created_at.toISOString(),
      confirmed_at: order.confirmed_at?.toISOString() ?? null,
      shipped_at: order.shipped_at?.toISOString() ?? null,
      delivered_at: order.delivered_at?.toISOString() ?? null,
    }
  } catch (error) {
    console.error('Track order error:', error)
    return { found: false, error: 'Something went wrong. Please try again.' }
  }
}
