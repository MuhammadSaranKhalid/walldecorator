'use server'

import { z } from 'zod'
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
import type { PaymentMethod } from '@/components/checkout/payment-section'
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
  /** 'cod' | 'card' — defaults to 'cod' */
  paymentMethod?: PaymentMethod
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
      /** True when the order is in 'pending' awaiting card payment. */
      requiresPayment: boolean
      message?: string
    }
  | {
      success: false
      error: string
    }

/**
 * Creates the order in the DB.
 *
 * For card flow: order is created in `pending` status; payment is confirmed
 * separately (see `markOrderPaid`). The order exists BEFORE the card is
 * charged so a failed post-charge update never produces a phantom charge.
 *
 * For COD: order is created in `confirmed`/`paid` directly (existing
 * behaviour) and a confirmation email is sent inline.
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

  // Phone is optional. If provided, re-validate server-side — the client
  // form already runs this check via Zod, but we defend against a tampered
  // or stale client state submitting a malformed number.
  if (input.phone && !isValidPhoneNumber(input.phone)) {
    return { success: false, error: 'Please enter a valid phone number.' }
  }

  // Country is required (the form has it default to the geo-detected one,
  // but we still re-check in case of a tampered submission).
  if (!input.shippingAddress.country) {
    return { success: false, error: 'Please select a country.' }
  }

  const isCard = input.paymentMethod === 'card'
  const dbPaymentMethod = isCard ? 'card' : 'cash_on_delivery'
  const initialStatus = isCard ? 'pending' : 'confirmed'
  const initialPaymentStatus = isCard ? 'pending' : 'paid'

  // Resolve currency once from {client value, geo cookie}. Used both for the
  // persisted display_currency and for the inline COD email below.
  const resolvedCurrency = await resolveDisplayCurrency(input.displayCurrency)

  try {
    const supabase = await createServerClient()

    // Send only variant_id + quantity to the RPC.
    // The unit price is looked up server-side inside create_order — anything
    // the client sends here is ignored as untrusted.
    const dbCartItems = input.cartItems.map((item) => ({
      variant_id: item.variantId,
      quantity: item.quantity,
    }))

    // Provisional subtotal (client estimate) used only to pick a shipping
    // band before we know the authoritative total. We re-read the canonical
    // subtotal/total from the orders row right after creation.
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
      // Store both ISO code (machine-friendly) and display name (human-friendly).
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
        // For card flow: payment_intent_id is set later by mark_order_paid.
        p_payment_intent_id: null,
        p_payment_method: dbPaymentMethod,
        p_shipping_cost: shippingCost,
        p_discount_amount: 0,
        p_tax_rate: 0,
        p_ip_address: input.ipAddress,
        p_user_agent: input.userAgent,
        p_initial_status: initialStatus,
        p_initial_payment_status: initialPaymentStatus,
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

    // Always stamp the resolved display_currency. Snapshot is best-effort —
    // we'll fall back to live rates if it's missing or stale.
    // Use Drizzle (direct Postgres connection) so RLS doesn't silently drop
    // this — the orders table has no UPDATE policy for anon, and the
    // user-session Supabase client would fail without raising an error.
    try {
      await db
        .update(orders)
        .set({
          display_currency: resolvedCurrency,
          ...(input.rateSnapshotId && { exchange_rate_snapshot_id: input.rateSnapshotId }),
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
        requiresPayment: isCard,
      }
    }

    // For COD only: send confirmation email inline. The order is INSERTed
    // directly as 'confirmed' which doesn't fire the DB trigger.
    // For card: the confirmation email is sent automatically when
    // mark_order_paid flips status from 'pending' → 'confirmed' (DB trigger
    // calls /api/send-order-confirmation).
    if (!isCard) {
      // Load live rates so the email renders in the same currency the buyer
      // saw at checkout. Failure to load rates falls back to PKR formatting.
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
    }

    return {
      success: true,
      orderId: orderId as string,
      orderNumber: order.order_number,
      totalAmount: Number(order.total_amount),
      requiresPayment: isCard,
    }
  } catch (error) {
    console.error('Unexpected error during order creation:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// ── Mark order paid / failed (card flow) ────────────────────────────────────

const orderIdSchema = z.uuid()
const paymentIntentIdSchema = z.string().min(1).max(200)

/**
 * Marks a previously-pending card order as confirmed/paid.
 * Idempotent: safe to call after the webhook has already flipped the row.
 * The DB trigger fires the order-confirmation email on the status transition.
 */
export async function markOrderPaid(
  orderId: string,
  paymentIntentId: string
): Promise<{ success: boolean; error?: string }> {
  const idCheck = orderIdSchema.safeParse(orderId)
  const piCheck = paymentIntentIdSchema.safeParse(paymentIntentId)
  if (!idCheck.success || !piCheck.success) {
    return { success: false, error: 'Invalid order or payment reference' }
  }

  try {
    const supabase = await createServerClient()
    const { error } = await supabase.rpc('mark_order_paid', {
      p_order_id: idCheck.data,
      p_payment_intent_id: piCheck.data,
    })
    if (error) {
      console.error('mark_order_paid error:', error)
      return { success: false, error: 'Failed to confirm payment.' }
    }
    return { success: true }
  } catch (err) {
    console.error('Unexpected mark_order_paid error:', err)
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

/**
 * Marks a pending card order as failed/cancelled, restoring inventory.
 * Idempotent. Called from the client when Stripe rejects the card and from
 * the webhook on `payment_intent.payment_failed`.
 */
export async function markOrderFailed(
  orderId: string,
  reason: string
): Promise<{ success: boolean }> {
  const idCheck = orderIdSchema.safeParse(orderId)
  if (!idCheck.success) return { success: false }

  const safeReason = (reason ?? 'Payment failed').slice(0, 500)

  try {
    const supabase = await createServerClient()
    const { error } = await supabase.rpc('mark_order_failed', {
      p_order_id: idCheck.data,
      p_reason: safeReason,
    })
    if (error) {
      console.error('mark_order_failed error:', error)
      return { success: false }
    }
    return { success: true }
  } catch (err) {
    console.error('Unexpected mark_order_failed error:', err)
    return { success: false }
  }
}
