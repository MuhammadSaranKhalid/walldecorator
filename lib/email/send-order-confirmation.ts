import { render } from '@react-email/components'
import { getAdminClient } from '@/lib/supabase/admin'
import { getStorageUrl } from '@/lib/supabase/storage'
import { getResend, FROM_EMAIL } from '@/lib/email'
import OrderConfirmationEmail from '@/emails/order-confirmation'
import type { AddressData } from '@/lib/validations/checkout'

interface SendOrderConfirmationParams {
  orderId: string
  orderNumber: string
  customerName: string
  customerEmail: string
  shippingAddress: AddressData
  subtotal: number
  shippingCost: number
  taxAmount: number
  total: number
}

interface OrderItemRow {
  product_name: string
  variant_description: string | null
  quantity: number
  unit_price: string | number
  total_price: string | number
  // order_items → product_variants → products → product_images → images
  // Supabase returns each nested FK join as an array
  product_variants: Array<{
    products: Array<{
      product_images: Array<{
        display_order: number
        is_primary: boolean
        images: Array<{ storage_path: string; medium_path: string | null }>
      }>
    }>
  }> | null
}

export async function sendOrderConfirmationEmail(
  params: SendOrderConfirmationParams
): Promise<void> {
  const {
    orderId,
    orderNumber,
    customerName,
    customerEmail,
    shippingAddress,
    subtotal,
    shippingCost,
    taxAmount,
    total,
  } = params

  const supabase = getAdminClient()

  const { data: orderItems, error } = await supabase
    .from('order_items')
    .select(`
      product_name,
      variant_description,
      quantity,
      unit_price,
      total_price,
      product_variants (
        products (
          product_images (
            display_order,
            is_primary,
            images (
              storage_path,
              medium_path
            )
          )
        )
      )
    `)
    .eq('order_id', orderId)

  if (error) {
    console.error('[email] Failed to fetch order items for', orderNumber, error)
    return
  }

  const emailItems = (orderItems as unknown as OrderItemRow[]).map((item) => {
    const productImages = item.product_variants?.[0]?.products?.[0]?.product_images ?? []
    const primaryImage =
      productImages.find((pi) => pi.is_primary) ??
      productImages.slice().sort((a, b) => a.display_order - b.display_order)[0]

    const img = primaryImage?.images?.[0]
    const imagePath = img?.medium_path ?? img?.storage_path

    return {
      name: item.product_name,
      material: item.variant_description || 'Standard',
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      totalPrice: Number(item.total_price),
      imageUrl: imagePath ? getStorageUrl(imagePath, 'product-images') : undefined,
    }
  })

  // Split name into first/last for the address block
  const nameParts = customerName.trim().split(/\s+/)
  const firstName = nameParts[0] ?? customerName
  const lastName = nameParts.slice(1).join(' ') || ''

  const emailAddress = {
    firstName,
    lastName,
    addressLine1: shippingAddress.line1,
    addressLine2: shippingAddress.line2,
    city: shippingAddress.city,
    state: shippingAddress.province,
    postalCode: shippingAddress.postalCode,
    country: 'Pakistan',
  }

  const orderDate = new Date().toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''

  const html = await render(
    OrderConfirmationEmail({
      orderNumber,
      customerName,
      orderDate,
      items: emailItems,
      subtotal,
      shippingCost,
      taxAmount,
      total,
      shippingAddress: emailAddress,
      trackingUrl: `${siteUrl}/track-order?order=${orderNumber}&email=${encodeURIComponent(customerEmail)}`,
    })
  )

  const resend = getResend()
  const { data, error: sendError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: customerEmail,
    subject: `Order Confirmed – ${orderNumber}`,
    html,
  })

  if (sendError) {
    console.error('[email] Failed to send order confirmation for', orderNumber, sendError)
  } else {
    console.log('[email] Order confirmation sent for', orderNumber, data?.id)
    // Log to email_logs (fire-and-forget, non-fatal)
    await supabase.from('email_logs').insert({
      order_id: orderId,
      email_type: 'order_confirmation',
      recipient_email: customerEmail,
      status: 'sent',
      resend_id: data?.id ?? null,
    }).then(({ error: logError }) => {
      if (logError) console.error('[email] Failed to log email_logs', logError)
    })
  }
}
