'use server'

import { cookies } from 'next/headers'
import { eq } from 'drizzle-orm'
import { isValidPhoneNumber } from 'libphonenumber-js/min'
import { getCountryName } from '@/lib/countries'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/client'
import { orders } from '@/lib/db/schema'
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '@/lib/constants'
import { getRates } from '@/lib/rates'
import type { CurrencyCode } from '@/lib/currency'
import type { AddressData } from '@/lib/validations/checkout'
import type { CartItem } from '@/store/cart.store'
import { sendOrderConfirmationEmail } from '@/lib/email/send-order-confirmation'

const VALID_CURRENCIES = ['PKR', 'USD', 'EUR', 'GBP'] as const

/**
 * Resolve the buyer's display currency.
 * Prefer the explicit value the client sent (which reflects manual selection).
 * If the client sent nothing or 'PKR' (the Zustand default which can leak when
 * the form submits before persist hydrates), fall back to the geo-detected
 * obsidian-currency-hint cookie that middleware refreshes on every request.
 */
async function resolveDisplayCurrency(
  clientValue: string | undefined
): Promise<CurrencyCode> {
  const fromClient = (clientValue ?? '').toUpperCase()
  if (fromClient && fromClient !== 'PKR' && VALID_CURRENCIES.includes(fromClient as CurrencyCode)) {
    return fromClient as CurrencyCode
  }

  const cookieStore = await cookies()
  const hint = cookieStore.get('obsidian-currency-hint')?.value?.toUpperCase()
  if (hint && VALID_CURRENCIES.includes(hint as CurrencyCode)) {
    return hint as CurrencyCode
  }

  return 'PKR'
}

type CreateOrderInput = {
  email: string
  name: string
  phone: string
  shippingAddress: AddressData
  billingAddress: AddressData | null
  cartItems: CartItem[]
  orderNotes?: string
  ipAddress: string
  userAgent: string
  /** Currency the user was viewing at checkout (display only) */
  displayCurrency?: string
  /** ID of the exchange_rate_snapshot active at purchase time */
  rateSnapshotId?: string
}

type CreateOrderResult =
  | {
      success: true
      orderId: string
      orderNumber: string
      totalAmount: number
      message?: string
    }
  | {
      success: false
      error: string
    }

/**
 * Creates a Cash-on-Delivery order.
 *
 * status='confirmed' (we will deliver), payment_status='pending' (cash not yet
 * collected). Staff flips payment_status to 'paid' from the admin app once
 * the courier collects cash on delivery.
 *
 * The orders table's RPC `create_order` still accepts payment_intent_id and
 * payment_method params for legacy reasons; we pass null/'cash_on_delivery'.
 */
export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  if (!input.cartItems || input.cartItems.length === 0) {
    return { success: false, error: 'Your cart is empty' }
  }

  if (!input.email || !input.name || !input.shippingAddress) {
    return { success: false, error: 'Missing required fields' }
  }

  if (input.phone && !isValidPhoneNumber(input.phone)) {
    return { success: false, error: 'Please enter a valid phone number.' }
  }

  if (!input.shippingAddress.country) {
    return { success: false, error: 'Please select a country.' }
  }

  const resolvedCurrency = await resolveDisplayCurrency(input.displayCurrency)

  try {
    const supabase = await createServerClient()

    const dbCartItems = input.cartItems.map((item) => ({
      variant_id: item.variantId,
      quantity: item.quantity,
    }))

    const estimatedSubtotal = input.cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
    const shippingCost =
      estimatedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST

    const shippingAddressJson = {
      line1: input.shippingAddress.line1,
      line2: input.shippingAddress.line2 || null,
      city: input.shippingAddress.city,
      postal_code: input.shippingAddress.postalCode || null,
      country_code: input.shippingAddress.country,
      country: getCountryName(input.shippingAddress.country),
    }

    const billingAddressJson = input.billingAddress
      ? {
          line1: input.billingAddress.line1,
          line2: input.billingAddress.line2 || null,
          city: input.billingAddress.city,
          postal_code: input.billingAddress.postalCode || null,
          country_code: input.billingAddress.country,
          country: getCountryName(input.billingAddress.country),
        }
      : shippingAddressJson

    const { data: orderId, error: createError } = await supabase.rpc(
      'create_order',
      {
        p_customer_email: input.email,
        p_customer_name: input.name,
        p_customer_phone: input.phone,
        p_shipping_address: shippingAddressJson,
        p_billing_address: billingAddressJson,
        p_cart_items: dbCartItems,
        p_payment_intent_id: null,
        p_payment_method: 'cash_on_delivery',
        p_shipping_cost: shippingCost,
        p_discount_amount: 0,
        p_tax_rate: 0,
        p_ip_address: input.ipAddress,
        p_user_agent: input.userAgent,
        p_initial_status: 'confirmed',
        p_initial_payment_status: 'pending',
      }
    )

    if (createError) {
      console.error('Order creation error:', createError)
      const isUserError = createError.code === '22023' || createError.code === 'P0001'
      const userMessage = isUserError
        ? createError.message
        : 'Failed to create order. Please try again.'
      return { success: false, error: userMessage }
    }

    // Persist the resolved display_currency via Drizzle (direct Postgres) so
    // RLS doesn't silently drop the update — the orders table has no UPDATE
    // policy for anon. Snapshot id is only applied when it's a real UUID;
    // the rates store uses placeholder ids ('base', 'seed') for fallback
    // rates which would fail the column's uuid type check.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const validSnapshotId =
      input.rateSnapshotId && UUID_RE.test(input.rateSnapshotId)
        ? input.rateSnapshotId
        : undefined

    try {
      await db
        .update(orders)
        .set({
          display_currency: resolvedCurrency,
          ...(validSnapshotId && { exchange_rate_snapshot_id: validSnapshotId }),
        })
        .where(eq(orders.id, orderId as string))
    } catch (err) {
      console.error('Failed to persist display_currency on order', orderId, err)
    }

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('order_number, subtotal, shipping_cost, tax_amount, total_amount')
      .eq('id', orderId)
      .single()

    if (fetchError || !order) {
      console.error('Failed to fetch order details:', fetchError)
      return {
        success: true,
        orderId: orderId as string,
        orderNumber: 'Unknown',
        totalAmount: 0,
      }
    }

    // COD orders are INSERTed directly as 'confirmed' which does not fire the
    // status-change trigger, so we send the confirmation email inline here.
    const { rates } = await getRates().catch(() => ({ rates: undefined }))

    sendOrderConfirmationEmail({
      orderId: orderId as string,
      orderNumber: order.order_number,
      customerName: input.name,
      customerEmail: input.email,
      shippingAddress: input.shippingAddress,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shipping_cost ?? 0),
      taxAmount: Number(order.tax_amount ?? 0),
      total: Number(order.total_amount),
      displayCurrency: resolvedCurrency,
      rates,
    }).catch((err) => console.error('[email] Unexpected error sending order confirmation', err))

    return {
      success: true,
      orderId: orderId as string,
      orderNumber: order.order_number,
      totalAmount: Number(order.total_amount),
    }
  } catch (error) {
    console.error('Unexpected error during order creation:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
