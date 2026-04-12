'use client'

import { type RefObject } from 'react'
import { Banknote, CreditCard } from 'lucide-react'
import { Elements } from '@stripe/react-stripe-js'
import type { StripeElementsOptions } from '@stripe/stripe-js'
import { getStripe } from '@/lib/stripe-client'
import { StripeCardSection, type StripeCardSectionRef } from './stripe-card-section'

export type PaymentMethod = 'cod' | 'card'

type PaymentSectionProps = {
  paymentMethod: PaymentMethod
  onPaymentMethodChange: (method: PaymentMethod) => void
  /** Cart total in PKR paisa (integer). Required for Stripe Elements amount hint. */
  amountInPaisa: number
  /** Ref forwarded to StripeCardSection for triggering confirmPayment() */
  stripeRef: RefObject<StripeCardSectionRef | null>
}

const stripePromise = getStripe()

export function PaymentSection({
  paymentMethod,
  onPaymentMethodChange,
  amountInPaisa,
  stripeRef,
}: PaymentSectionProps) {
  const elementsOptions: StripeElementsOptions = {
    mode: 'payment',
    amount: amountInPaisa,
    currency: 'pkr',
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#1a2e4a', // brand-navy
        borderRadius: '8px',
      },
    },
  }

  return (
    <div className="space-y-4">
      <div className="pb-2 border-b">
        <h2 className="text-xl font-semibold">Payment</h2>
        <p className="text-sm text-muted-foreground mt-1">
          All transactions are secure and encrypted
        </p>
      </div>

      {/* Payment method selector */}
      <div className="space-y-3">
        {/* Cash on Delivery option */}
        <button
          type="button"
          onClick={() => onPaymentMethodChange('cod')}
          className={`w-full rounded-lg border p-4 text-left transition-colors ${
            paymentMethod === 'cod'
              ? 'border-brand-navy bg-brand-navy/5 ring-1 ring-brand-navy'
              : 'border-border bg-card hover:border-brand-navy/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 shrink-0 ${
                paymentMethod === 'cod'
                  ? 'border-brand-navy bg-brand-navy'
                  : 'border-muted-foreground'
              }`}
            >
              {paymentMethod === 'cod' && (
                <div className="h-2 w-2 rounded-full bg-white" />
              )}
            </div>
            <Banknote className="h-5 w-5 text-brand-navy shrink-0" />
            <div>
              <p className="font-semibold text-sm">Cash on Delivery</p>
              <p className="text-xs text-muted-foreground">Pay when your order arrives</p>
            </div>
          </div>
        </button>

        {/* Card Payment option */}
        <button
          type="button"
          onClick={() => onPaymentMethodChange('card')}
          className={`w-full rounded-lg border p-4 text-left transition-colors ${
            paymentMethod === 'card'
              ? 'border-brand-navy bg-brand-navy/5 ring-1 ring-brand-navy'
              : 'border-border bg-card hover:border-brand-navy/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 shrink-0 ${
                paymentMethod === 'card'
                  ? 'border-brand-navy bg-brand-navy'
                  : 'border-muted-foreground'
              }`}
            >
              {paymentMethod === 'card' && (
                <div className="h-2 w-2 rounded-full bg-white" />
              )}
            </div>
            <CreditCard className="h-5 w-5 text-brand-navy shrink-0" />
            <div>
              <p className="font-semibold text-sm">Credit / Debit Card</p>
              <p className="text-xs text-muted-foreground">
                Visa, Mastercard, and more — secured by Stripe
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* COD note */}
      {paymentMethod === 'cod' && (
        <div className="rounded-md bg-blue-50 border border-blue-100 p-4">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Note:</span> Please have the exact amount
            ready when the delivery person arrives.
          </p>
        </div>
      )}

      {/* Stripe card form — only mounts when card is selected */}
      {paymentMethod === 'card' && (
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <Elements stripe={stripePromise} options={elementsOptions}>
            <StripeCardSection ref={stripeRef} />
          </Elements>
        </div>
      )}
    </div>
  )
}
