'use server'

import { createServerClient } from '@/lib/supabase/server'
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '@/lib/constants'
import type { AddressData } from '@/lib/validations/checkout'
import type { CartItem } from '@/store/cart.store'

/**
 * Input types for createOrder action
 */
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
}

/**
 * Return type for createOrder action
 */
type CreateOrderResult = {
  success: boolean
  orderId?: string
  orderNumber?: string
  message?: string
  error?: string
}

/**
 * Create order from checkout form data
 * Server Action for checkout page
 */
export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  // Validate input
  if (!input.cartItems || input.cartItems.length === 0) {
    return {
      success: false,
      error: 'Your cart is empty',
    }
  }

  if (!input.email || !input.name || !input.phone || !input.shippingAddress) {
    return {
      success: false,
      error: 'Missing required fields',
    }
  }

  try {
    const supabase = await createServerClient()

    // Transform cart items to database format
    const dbCartItems = input.cartItems.map((item) => ({
      variant_id: item.variantId,
      quantity: item.quantity,
      price: item.price,
    }))

    // Calculate subtotal
    const subtotal = input.cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )

    // Calculate shipping cost (free if >= threshold)
    const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST

    // Format shipping address as JSONB
    const shippingAddressJson = {
      line1: input.shippingAddress.line1,
      line2: input.shippingAddress.line2 || null,
      city: input.shippingAddress.city,
      province: input.shippingAddress.province,
      postal_code: input.shippingAddress.postalCode,
      country: 'Pakistan',
    }

    // Format billing address (use shipping if same)
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

    // Call database function to create order
    const { data: orderId, error: createError } = await supabase.rpc(
      'create_order',
      {
        p_customer_email: input.email,
        p_customer_name: input.name,
        p_customer_phone: input.phone,
        p_shipping_address: shippingAddressJson,
        p_billing_address: billingAddressJson,
        p_cart_items: dbCartItems,
        p_payment_intent_id: null, // COD has no payment intent
        p_payment_method: 'cash_on_delivery',
        p_shipping_cost: shippingCost,
        p_discount_amount: 0, // No discount support yet
        p_tax_rate: 0, // No sales tax for Pakistan
        p_ip_address: input.ipAddress,
        p_user_agent: input.userAgent,
      }
    )

    if (createError) {
      console.error('Order creation error:', createError)
      return {
        success: false,
        error: 'Failed to create order. Please try again.',
      }
    }

    // Fetch order details to get order number
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('order_number')
      .eq('id', orderId)
      .single()

    if (fetchError || !order) {
      console.error('Failed to fetch order details:', fetchError)
      // Order was created but we couldn't fetch details
      return {
        success: true,
        orderId: orderId as string,
        orderNumber: 'Unknown', // Fallback
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
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}
