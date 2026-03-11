'use client'

import { useState, useTransition, useCallback } from 'react'
import { trackOrder, type TrackOrderResult } from '@/actions/track-order'
import { formatPrice } from '@/lib/utils'

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; description: string }
> = {
  pending: {
    label: 'Order Received',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50 border-yellow-200',
    description: 'Your order has been received and is being reviewed.',
  },
  confirmed: {
    label: 'Confirmed',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    description: 'Your order is confirmed and being prepared.',
  },
  shipped: {
    label: 'Shipped',
    color: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-200',
    description: 'Your order is on its way!',
  },
  delivered: {
    label: 'Delivered',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    description: 'Your order has been delivered.',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
    description: 'This order has been cancelled.',
  },
}

const STEPS = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
]

const STEP_ORDER = ['pending', 'confirmed', 'shipped', 'delivered']

function getStepIndex(status: string) {
  return STEP_ORDER.indexOf(status)
}

// ─── Order Result Display ─────────────────────────────────────────────────────

function OrderResult({ result }: { result: Extract<TrackOrderResult, { found: true }> }) {
  const statusConfig = STATUS_CONFIG[result.status] ?? STATUS_CONFIG.pending
  const currentStepIndex = getStepIndex(result.status)
  const isCancelled = result.status === 'cancelled'

  const formatDate = (iso: string | null) => {
    if (!iso) return null
    return new Date(iso).toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6 mt-8">
      {/* Order Header */}
      <div className={`border rounded-xl p-5 ${statusConfig.bg}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Order Number</p>
            <p className="text-xl font-bold text-primary font-mono">{result.order_number}</p>
          </div>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${statusConfig.bg} ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>
        <p className={`mt-2 text-sm ${statusConfig.color}`}>{statusConfig.description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Placed on {formatDate(result.created_at)}
        </p>
      </div>

      {/* Progress Tracker */}
      {!isCancelled && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-5">Order Progress</h3>
          <div className="flex items-center">
            {STEPS.map((step, index) => {
              const isCompleted = index <= currentStepIndex
              const isActive = index === currentStepIndex

              return (
                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                  {/* Step Circle */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
                        isCompleted
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-background border-border text-muted-foreground'
                      } ${isActive ? 'ring-2 ring-primary/30 ring-offset-1' : ''}`}
                    >
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    <p className={`text-xs mt-2 text-center w-16 leading-tight ${isCompleted ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                      {step.label}
                    </p>
                  </div>
                  {/* Connector Line */}
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-1 mb-5 transition-colors ${
                        index < currentStepIndex ? 'bg-primary' : 'bg-border'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Timestamps */}
          {(result.confirmed_at || result.shipped_at || result.delivered_at) && (
            <div className="mt-5 pt-4 border-t border-border space-y-1">
              {result.confirmed_at && (
                <p className="text-xs text-muted-foreground">✓ Confirmed: {formatDate(result.confirmed_at)}</p>
              )}
              {result.shipped_at && (
                <p className="text-xs text-muted-foreground">✓ Shipped: {formatDate(result.shipped_at)}</p>
              )}
              {result.delivered_at && (
                <p className="text-xs text-muted-foreground">✓ Delivered: {formatDate(result.delivered_at)}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Order Items */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">
            Items ({result.items.reduce((sum, i) => sum + i.quantity, 0)})
          </h3>
        </div>
        <div className="divide-y divide-border">
          {result.items.map((item) => (
            <div key={item.id} className="px-5 py-4 flex justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.product_name}</p>
                {item.variant_description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{item.variant_description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">SKU: {item.sku} · Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-foreground whitespace-nowrap">
                {formatPrice(item.total_price)}
              </p>
            </div>
          ))}
        </div>
        {/* Totals */}
        <div className="px-5 py-4 bg-secondary/30 border-t border-border space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatPrice(result.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Shipping</span>
            <span>{result.shipping_cost === 0 ? 'Free' : formatPrice(result.shipping_cost)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-border">
            <span>Total</span>
            <span>{formatPrice(result.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Shipping Address</h3>
        <address className="not-italic text-sm text-muted-foreground space-y-0.5">
          <p className="font-medium text-foreground">{result.customer_name}</p>
          <p>{result.shipping_address.line1}</p>
          {result.shipping_address.line2 && <p>{result.shipping_address.line2}</p>}
          <p>
            {result.shipping_address.city}, {result.shipping_address.province}
          </p>
          <p>{result.shipping_address.country}</p>
        </address>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function TrackOrderForm() {
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<TrackOrderResult | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setResult(null)

      startTransition(async () => {
        const data = await trackOrder(orderNumber, email)
        setResult(data)
      })
    },
    [orderNumber, email]
  )

  return (
    <main className="container mx-auto px-4 py-12 max-w-lg">
      {/* Heading */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Track Your Order</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Enter your order number and the email used at checkout.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4"
      >
        <div className="space-y-1.5">
          <label htmlFor="order-number" className="text-sm font-medium text-foreground">
            Order Number
          </label>
          <input
            id="order-number"
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="e.g. WD-20240311-1234"
            required
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="track-email" className="text-sm font-medium text-foreground">
            Email Address
          </label>
          <input
            id="track-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isPending ? 'Looking up order...' : 'Track Order'}
        </button>
      </form>

      {/* Error state */}
      {result && !result.found && (
        <div className="mt-6 border border-destructive/20 bg-destructive/5 text-destructive rounded-xl p-4 text-sm text-center">
          {result.error}
        </div>
      )}

      {/* Success state */}
      {result && result.found && <OrderResult result={result} />}
    </main>
  )
}
