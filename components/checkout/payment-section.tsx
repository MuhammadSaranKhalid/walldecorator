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
  amountInPaisa: number
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
      theme: 'night',
      variables: {
        colorPrimary: '#c9a84c',
        colorBackground: '#111111',
        colorText: '#f0ece4',
        borderRadius: '0px',
      },
    },
  }

  return (
    <div className="space-y-4">
      <div className="pb-2 border-b border-[var(--obsidian-border)]">
        <h2 className="text-xl font-semibold text-[var(--obsidian-gold)]">Payment</h2>
        <p className="text-sm text-[var(--obsidian-text-muted)] mt-1">
          All transactions are secure and encrypted
        </p>
      </div>

      <div className="space-y-3">
        {/* Cash on Delivery */}
        <button
          type="button"
          onClick={() => onPaymentMethodChange('cod')}
          className={`w-full border p-4 text-left transition-colors ${
            paymentMethod === 'cod'
              ? 'border-[var(--obsidian-gold)] bg-[var(--obsidian-gold)]/10'
              : 'border-[var(--obsidian-border)] bg-[var(--obsidian-surface)] hover:border-[var(--obsidian-gold)]/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 shrink-0 ${
                paymentMethod === 'cod'
                  ? 'border-[var(--obsidian-gold)] bg-[var(--obsidian-gold)]'
                  : 'border-[var(--obsidian-text-muted)]'
              }`}
            >
              {paymentMethod === 'cod' && (
                <div className="h-2 w-2 rounded-full bg-[var(--obsidian-bg)]" />
              )}
            </div>
            <Banknote className="h-5 w-5 text-[var(--obsidian-gold)] shrink-0" />
            <div>
              <p className="font-semibold text-sm text-[var(--obsidian-text)]">Cash on Delivery</p>
              <p className="text-xs text-[var(--obsidian-text-muted)]">Pay when your order arrives</p>
            </div>
          </div>
        </button>

        {/* Card Payment */}
        <button
          type="button"
          onClick={() => onPaymentMethodChange('card')}
          className={`w-full border p-4 text-left transition-colors ${
            paymentMethod === 'card'
              ? 'border-[var(--obsidian-gold)] bg-[var(--obsidian-gold)]/10'
              : 'border-[var(--obsidian-border)] bg-[var(--obsidian-surface)] hover:border-[var(--obsidian-gold)]/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 shrink-0 ${
                paymentMethod === 'card'
                  ? 'border-[var(--obsidian-gold)] bg-[var(--obsidian-gold)]'
                  : 'border-[var(--obsidian-text-muted)]'
              }`}
            >
              {paymentMethod === 'card' && (
                <div className="h-2 w-2 rounded-full bg-[var(--obsidian-bg)]" />
              )}
            </div>
            <CreditCard className="h-5 w-5 text-[var(--obsidian-gold)] shrink-0" />
            <div>
              <p className="font-semibold text-sm text-[var(--obsidian-text)]">Credit / Debit Card</p>
              <p className="text-xs text-[var(--obsidian-text-muted)]">
                Visa, Mastercard, and more — secured by Stripe
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* COD note */}
      {paymentMethod === 'cod' && (
        <div className="bg-[var(--obsidian-surface)] border border-[var(--obsidian-border)] p-4">
          <p className="text-sm text-[var(--obsidian-text-muted)]">
            <span className="font-semibold text-[var(--obsidian-text)]">Note:</span> Please have the exact amount
            ready when the delivery person arrives.
          </p>
        </div>
      )}

      {/* Stripe card form */}
      {paymentMethod === 'card' && (
        <div className="border border-[var(--obsidian-border)] bg-[var(--obsidian-surface)] p-4 space-y-4">
          <Elements stripe={stripePromise} options={elementsOptions}>
            <StripeCardSection ref={stripeRef} />
          </Elements>
        </div>
      )}
    </div>
  )
}
