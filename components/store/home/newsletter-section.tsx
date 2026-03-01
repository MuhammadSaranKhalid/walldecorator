'use client'

import { useState, useTransition } from 'react'
import { subscribeToNewsletter } from '@/actions/newsletter'

export function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email) return

    startTransition(async () => {
      // Call Server Action directly
      const result = await subscribeToNewsletter(email)

      if (result.success) {
        setStatus('success')
        setEmail('')
        setErrorMessage('')
      } else {
        setStatus('error')
        setErrorMessage(result.error || 'Something went wrong. Please try again.')
      }
    })
  }

  return (
    <section className="py-20 bg-primary">
      <div className="container mx-auto px-4 text-center max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-3">
          Stay in the Loop
        </p>
        <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground mb-3">
          Get 10% Off Your First Order
        </h2>
        <p className="text-primary-foreground/70 mb-8">
          Subscribe to our newsletter for exclusive deals, new arrivals, and
          style tips.
        </p>

        {status === 'success' ? (
          <div className="bg-accent/20 border border-accent rounded-2xl px-8 py-6">
            <p className="text-accent font-semibold text-lg">
              🎉 You&apos;re in!
            </p>
            <p className="text-accent/80 text-sm mt-1">
              Check your inbox for your 10% discount code.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isPending}
              className="
                flex-1 px-5 py-4 rounded-full bg-primary-foreground/10 border border-primary-foreground/20
                text-primary-foreground placeholder-primary-foreground/50
                focus:outline-none focus:border-accent
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
            />
            <button
              type="submit"
              disabled={isPending}
              className="
                px-8 py-4 bg-accent text-accent-foreground font-semibold
                rounded-full shrink-0 shadow-lg
                hover:bg-accent/90 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed
                transition-all
              "
            >
              {isPending ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="text-destructive text-sm mt-3">{errorMessage}</p>
        )}

        <p className="text-primary-foreground/50 text-xs mt-4">
          No spam, ever. Unsubscribe at any time.
        </p>
      </div>
    </section>
  )
}
