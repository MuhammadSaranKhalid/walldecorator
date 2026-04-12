'use client'

import {
  useStripe,
  useElements,
  PaymentElement,
} from '@stripe/react-stripe-js'
import { useImperativeHandle, useState, type Ref } from 'react'
import { Loader2 } from 'lucide-react'

export type StripeCardSectionRef = {
  /**
   * Validates the PaymentElement, creates a PaymentIntent, and confirms payment.
   * Returns the Stripe paymentIntentId on success, or an error message.
   */
  confirmPayment(cartItems: { price: number; quantity: number }[]): Promise<{
    success: boolean
    paymentIntentId?: string
    error?: string
  }>
}

type Props = {
  ref: Ref<StripeCardSectionRef | null>
}

// React 19: ref can be passed as a regular prop (no forwardRef needed)
export function StripeCardSection({ ref }: Props) {
  const stripe = useStripe()
  const elements = useElements()
  const [isReady, setIsReady] = useState(false)

  useImperativeHandle(ref, () => ({
    async confirmPayment(cartItems) {
      if (!stripe || !elements) {
        return { success: false, error: 'Stripe has not loaded yet. Please try again.' }
      }

      // Step 1: Validate the PaymentElement before hitting the server
      const { error: submitError } = await elements.submit()
      if (submitError) {
        return { success: false, error: submitError.message }
      }

      // Step 2: Create the PaymentIntent server-side (deferred intent pattern)
      let clientSecret: string
      try {
        const res = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartItems }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          return { success: false, error: data.error ?? 'Failed to initialize payment' }
        }

        const data = await res.json()
        clientSecret = data.clientSecret
      } catch {
        return { success: false, error: 'Network error. Please try again.' }
      }

      // Step 3: Confirm the payment with the newly created clientSecret
      const { paymentIntent, error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          // For 3DS flows: user is redirected here then back, so keep
          // the return_url pointing at the checkout page so they can retry.
          return_url: `${window.location.origin}/checkout`,
        },
        // Avoids a page redirect for straightforward card payments (no 3DS).
        redirect: 'if_required',
      })

      if (confirmError) {
        return { success: false, error: confirmError.message }
      }

      if (paymentIntent?.status === 'succeeded') {
        return { success: true, paymentIntentId: paymentIntent.id }
      }

      return { success: false, error: 'Payment was not completed. Please try again.' }
    },
  }))

  return (
    <div className="space-y-4">
      <PaymentElement
        onReady={() => setIsReady(true)}
        options={{
          layout: 'tabs',
          wallets: { applePay: 'auto', googlePay: 'auto' },
        }}
      />
      {!isReady && (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading payment form…</span>
        </div>
      )}
    </div>
  )
}
