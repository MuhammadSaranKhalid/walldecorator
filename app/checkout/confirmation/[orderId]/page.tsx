import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2, Package, Phone, MapPin } from 'lucide-react'

import { createServerClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/currency'
import { getRates } from '@/lib/rates'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { DeliveryMap } from '@/components/checkout/delivery-map'

type Props = {
  params: Promise<{ orderId: string }>
}

async function getOrderDetails(orderId: string) {
  const supabase = await createServerClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      order_items (
        *
      )
    `
    )
    .eq('id', orderId)
    .single()

  if (error || !order) {
    return null
  }

  return order
}

export default async function OrderConfirmationPage({ params }: Props) {
  const { orderId } = await params
  const [order, { rates }] = await Promise.all([getOrderDetails(orderId), getRates()])

  if (!order) {
    notFound()
  }

  const displayCurrency = (order as any).display_currency ?? 'PKR'

  const shippingAddress = order.shipping_address as {
    line1: string
    line2?: string
    city: string
    province: string
    postal_code: string
    country: string
  }

  const addressQueryOptions = Array.from(new Set([
    [shippingAddress.line1, shippingAddress.city, shippingAddress.province, shippingAddress.country].filter(Boolean).join(', '),
    [shippingAddress.city, shippingAddress.province, shippingAddress.country].filter(Boolean).join(', '),
    [shippingAddress.city, shippingAddress.country].filter(Boolean).join(', '),
  ].filter(Boolean)))

  const addressLabel = [
    shippingAddress.line1,
    shippingAddress.city,
    shippingAddress.province,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="min-h-screen bg-[var(--obsidian-bg)]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-[var(--obsidian-gold)]/20 p-4">
              <CheckCircle2 className="h-12 w-12 text-[var(--obsidian-gold)]" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[var(--obsidian-gold)] mb-2">Order Confirmed!</h1>
          <p className="text-[var(--obsidian-text-muted)]">
            Thank you for your order. We've sent a confirmation to{' '}
            <span className="font-medium text-[var(--obsidian-text)]">{order.customer_email}</span>
          </p>
        </div>

        {/* Order number */}
        <div className="bg-[var(--obsidian-surface)] border border-[var(--obsidian-border)] p-6 mb-6">
          <h2 className="text-lg font-semibold text-[var(--obsidian-text)] mb-4">Order Details</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--obsidian-text-muted)]">Order Number</span>
              <span className="font-mono font-medium text-[var(--obsidian-text)]">{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--obsidian-text-muted)]">Order Date</span>
              <span className="font-medium text-[var(--obsidian-text)]">
                {new Date(order.created_at).toLocaleDateString('en-PK', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--obsidian-text-muted)]">Payment Method</span>
              <span className="font-medium text-[var(--obsidian-text)]">Cash on Delivery</span>
            </div>
          </div>
        </div>

        {/* Order items */}
        <div className="bg-[var(--obsidian-surface)] border border-[var(--obsidian-border)] p-6 mb-6">
          <h2 className="text-lg font-semibold text-[var(--obsidian-text)] mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-[var(--obsidian-gold)]" />
            Items Ordered
          </h2>
          <div className="space-y-4">
            {order.order_items.map((item: any) => (
              <div key={item.id} className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-[var(--obsidian-text)]">{item.product_name}</p>
                  <p className="text-sm text-[var(--obsidian-text-muted)]">{item.variant_description}</p>
                  <p className="text-sm text-[var(--obsidian-text-muted)]">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium text-[var(--obsidian-gold)]">{formatPrice(Number(item.total_price), displayCurrency, rates)}</p>
              </div>
            ))}

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--obsidian-text-muted)]">Subtotal</span>
                <span className="text-[var(--obsidian-text)]">{formatPrice(Number(order.subtotal), displayCurrency, rates)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--obsidian-text-muted)]">Shipping</span>
                <span>
                  {order.shipping_cost === 0 ? (
                    <span className="text-[var(--obsidian-gold)] font-medium">Free</span>
                  ) : (
                    <span className="text-[var(--obsidian-text)]">{formatPrice(Number(order.shipping_cost), displayCurrency, rates)}</span>
                  )}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span className="text-[var(--obsidian-text)]">Total</span>
                <span className="text-[var(--obsidian-gold)]">{formatPrice(Number(order.total_amount), displayCurrency, rates)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping address */}
        <div className="bg-[var(--obsidian-surface)] border border-[var(--obsidian-border)] p-6 mb-6">
          <h2 className="text-lg font-semibold text-[var(--obsidian-text)] mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[var(--obsidian-gold)]" />
            Shipping Address
          </h2>
          <div className="text-sm text-[var(--obsidian-text)]">
            <p className="font-medium">{order.customer_name}</p>
            <p className="mt-1">{shippingAddress.line1}</p>
            {shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
            <p>
              {shippingAddress.city}, {shippingAddress.province}{' '}
              {shippingAddress.postal_code}
            </p>
            <p>{shippingAddress.country}</p>
            <p className="mt-2 flex items-center gap-2 text-[var(--obsidian-text-muted)]">
              <Phone className="h-4 w-4" />
              {order.customer_phone}
            </p>
          </div>
        </div>

        {/* Delivery map */}
        <div className="mb-6">
          <DeliveryMap addressQueryOptions={addressQueryOptions} addressLabel={addressLabel} />
        </div>

        {/* What's next */}
        <div className="bg-[var(--obsidian-surface)] border border-[var(--obsidian-border)] p-6 mb-8">
          <h2 className="text-lg font-semibold text-[var(--obsidian-text)] mb-4">What's Next?</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--obsidian-text-muted)]">
            <li>You will receive a confirmation call from our team soon</li>
            <li>Your order will be prepared and dispatched</li>
            <li>
              Please keep the exact payment amount ready (
              <span className="font-medium text-[var(--obsidian-text)]">{formatPrice(Number(order.total_amount), displayCurrency, rates)}</span>
              )
            </li>
            <li>Pay the delivery person upon receiving your order</li>
          </ol>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-[var(--obsidian-gold)] hover:bg-[var(--obsidian-gold-light)] text-[var(--obsidian-bg)] font-[family-name:var(--font-dm-sans)] tracking-[0.1em] uppercase text-[11px]"
          >
            <Link href="/">Continue Shopping</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-[var(--obsidian-border)] text-[var(--obsidian-text)] hover:border-[var(--obsidian-gold)] hover:text-[var(--obsidian-gold)]"
          >
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
