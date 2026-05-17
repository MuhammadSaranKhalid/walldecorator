import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Returns & Refunds | Wall Decorator',
  description: 'How to return or report an issue with your Wall Decorator order.',
}

export default function ReturnsPage() {
  return (
    <main className="container mx-auto px-4 py-12 max-w-3xl text-[var(--obsidian-text)]">
      <h1 className="font-[family-name:var(--font-cormorant)] text-4xl text-[var(--obsidian-gold)] mb-2">
        Returns &amp; Refunds
      </h1>
      <p className="text-sm text-[var(--obsidian-text-muted)] mb-10">
        We stand behind every piece we make.
      </p>

      <section className="space-y-8 text-[15px] leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold text-[var(--obsidian-gold)] mb-2">
            Inspect before paying
          </h2>
          <p className="text-[var(--obsidian-text-muted)]">
            Because we operate on Cash on Delivery, you have the right to inspect
            your order at the door. If the piece is visibly damaged or significantly
            different from what you ordered, you may refuse delivery without paying.
            Please tell the courier and contact us right after so we can send a
            replacement.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--obsidian-gold)] mb-2">
            Damaged or defective items
          </h2>
          <p className="text-[var(--obsidian-text-muted)]">
            If you discover damage after delivery, please reach out within{' '}
            <span className="text-[var(--obsidian-text)] font-medium">7 days</span> of
            receiving your order. Send us photos of the damage and your order number,
            and we'll arrange a free replacement.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--obsidian-gold)] mb-2">
            Custom orders
          </h2>
          <p className="text-[var(--obsidian-text-muted)]">
            Custom-made pieces are crafted to your exact specifications and are
            non-returnable, except in the case of a manufacturing defect or shipping
            damage. We'll confirm every spec with you in writing before we start work.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--obsidian-gold)] mb-2">
            Cancelling an order
          </h2>
          <p className="text-[var(--obsidian-text-muted)]">
            Need to cancel? Please{' '}
            <Link href="/contact" className="text-[var(--obsidian-gold)] hover:underline">
              contact us
            </Link>{' '}
            as soon as possible. We can cancel before dispatch at no cost. After
            dispatch, you can still refuse the courier at the door — no payment is
            collected.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--obsidian-gold)] mb-2">
            How to start a return or report an issue
          </h2>
          <p className="text-[var(--obsidian-text-muted)]">
            Email us at{' '}
            <a
              href="mailto:orders@walldecorator.store"
              className="text-[var(--obsidian-gold)] hover:underline"
            >
              orders@walldecorator.store
            </a>{' '}
            with your order number and a clear description of the issue. We typically
            respond within 24 hours on working days.
          </p>
        </div>
      </section>
    </main>
  )
}
