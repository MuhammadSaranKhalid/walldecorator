'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Checkout error boundary caught:', error)
  }, [error])

  return (
    <main className="container mx-auto px-4 py-24 max-w-lg text-center text-[var(--obsidian-text)]">
      <div className="flex justify-center mb-6">
        <div className="rounded-full bg-[var(--obsidian-gold)]/15 p-4">
          <AlertCircle className="h-10 w-10 text-[var(--obsidian-gold)]" />
        </div>
      </div>
      <h1 className="font-[family-name:var(--font-cormorant)] text-3xl text-[var(--obsidian-gold)] mb-3">
        Something went wrong at checkout
      </h1>
      <p className="text-sm text-[var(--obsidian-text-muted)] mb-8">
        Your cart is safe. Please try again, and if the problem keeps happening, contact us and we'll
        place your order manually.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-[var(--obsidian-gold)] text-[var(--obsidian-bg)] text-[11px] tracking-[0.1875em] uppercase font-medium hover:bg-[var(--obsidian-gold-light)] transition-colors"
        >
          Try again
        </button>
        <Link
          href="/contact"
          className="px-6 py-3 border border-[var(--obsidian-border)] text-[var(--obsidian-text)] text-[11px] tracking-[0.1875em] uppercase font-medium hover:border-[var(--obsidian-gold)] hover:text-[var(--obsidian-gold)] transition-colors"
        >
          Contact us
        </Link>
      </div>
    </main>
  )
}
