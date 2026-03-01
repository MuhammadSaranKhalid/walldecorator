import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2, Package, Phone, MapPin } from 'lucide-react'

import { createServerClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

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
  const order = await getOrderDetails(orderId)

  if (!order) {
    notFound()
  }

  const shippingAddress = order.shipping_address as {
    line1: string
    line2?: string
    city: string
    province: string
    postal_code: string
    country: string
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Success header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-green-100 p-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-gray-600">
          Thank you for your order. We've sent a confirmation to{' '}
          <span className="font-medium">{order.customer_email}</span>
        </p>
      </div>

      {/* Order number */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Number</span>
              <span className="font-mono font-medium">{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Order Date</span>
              <span className="font-medium">
                {new Date(order.created_at).toLocaleDateString('en-PK', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium">Cash on Delivery</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Items Ordered
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.order_items.map((item: any) => (
              <div key={item.id} className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-gray-600">{item.variant_description}</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium">{formatPrice(item.total_price)}</p>
              </div>
            ))}

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span>
                  {order.shipping_cost === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    formatPrice(order.shipping_cost)
                  )}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping address */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Shipping Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            <p className="font-medium">{order.customer_name}</p>
            <p className="mt-1">{shippingAddress.line1}</p>
            {shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
            <p>
              {shippingAddress.city}, {shippingAddress.province}{' '}
              {shippingAddress.postal_code}
            </p>
            <p>{shippingAddress.country}</p>
            <p className="mt-2 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {order.customer_phone}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* What's next */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">What's Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>You will receive a confirmation call from our team soon</li>
            <li>Your order will be prepared and dispatched</li>
            <li>
              Please keep the exact payment amount ready (
              <span className="font-medium">{formatPrice(order.total_amount)}</span>
              )
            </li>
            <li>Pay the delivery person upon receiving your order</li>
          </ol>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button asChild size="lg">
          <Link href="/">Continue Shopping</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>
    </div>
  )
}
