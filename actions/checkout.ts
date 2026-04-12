'use server'

import { createServerClient } from '@/lib/supabase/server'
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '@/lib/constants'
import type { AddressData } from '@/lib/validations/checkout'
import type { CartItem } from '@/store/cart.store'
import type { PaymentMethod } from '@/components/checkout/payment-section'

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
  /** Stripe PaymentIntent ID — required when paymentMethod is 'card' */
  paymentIntentId?: string
}

type CreateOrderResult = {
  success: boolean
  orderId?: string
  orderNumber?: string
  message?: string
  error?: string
}

export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  if (!input.cartItems || input.cartItems.length === 0) {
    return { success: false, error: 'Your cart is empty' }
  }

  if (!input.email || !input.name || !input.phone || !input.shippingAddress) {
    return { success: false, error: 'Missing required fields' }
  }

  // Map payment method to the value the DB expects
  const dbPaymentMethod =
    input.paymentMethod === 'card' ? 'card' : 'cash_on_delivery'

  try {
    const supabase = await createServerClient()

    const dbCartItems = input.cartItems.map((item) => ({
      variant_id: item.variantId,
      quantity: item.quantity,
      price: item.price,
    }))

    const subtotal = input.cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
    const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST

    const shippingAddressJson = {
      line1: input.shippingAddress.line1,
      line2: input.shippingAddress.line2 || null,
      city: input.shippingAddress.city,
      province: input.shippingAddress.province,
      postal_code: input.shippingAddress.postalCode,
      country: 'Pakistan',
    }

    const billingAddressJson = input.billingAddress
      ? {
          line1: input.billingAddress.line1,
          line2: input.billingAddress.line2 || null,
          city: input.billingAddress.city,
          province: input.billingAddress.province,
          postal_code: input.billingAddress.postalCode,
          country: 'Pakistan',
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
        p_payment_intent_id: input.paymentIntentId ?? null,
        p_payment_method: dbPaymentMethod,
        p_shipping_cost: shippingCost,
        p_discount_amount: 0,
        p_tax_rate: 0,
        p_ip_address: input.ipAddress,
        p_user_agent: input.userAgent,
      }
    )

    if (createError) {
      console.error('Order creation error:', createError)
      // The RPC raises user-readable exceptions (SQLSTATE 22023) for domain
      // errors such as missing variants. Surface those directly; fall back to
      // a generic message for unexpected infrastructure errors.
      const isUserError = createError.code === '22023' || createError.code === 'P0001'
      const userMessage = isUserError
        ? createError.message
        : 'Failed to create order. Please try again.'
      return { success: false, error: userMessage }
    }

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('order_number')
      .eq('id', orderId)
      .single()

    if (fetchError || !order) {
      console.error('Failed to fetch order details:', fetchError)
      return {
        success: true,
        orderId: orderId as string,
        orderNumber: 'Unknown',
        message: 'Order placed successfully!',
      }
    }

    return {
      success: true,
      orderId: orderId as string,
      orderNumber: order.order_number,
      message: 'Order placed successfully!',
    }
  } catch (error) {
    console.error('Unexpected error during order creation:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
