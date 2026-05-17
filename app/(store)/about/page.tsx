import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Wall Decorator',
  description: 'The story behind Wall Decorator — precision-crafted laser-cut wall art, made in Pakistan.',
}

export default function AboutPage() {
  return (
    <main className="container mx-auto px-4 py-12 max-w-3xl text-[var(--obsidian-text)]">
      <h1 className="font-[family-name:var(--font-cormorant)] text-4xl text-[var(--obsidian-gold)] mb-2">
        About Wall Decorator
      </h1>
      <p className="text-sm text-[var(--obsidian-text-muted)] mb-10">
        Precision-crafted wall art, made in Pakistan.
      </p>

      <section className="space-y-6 text-[15px] leading-relaxed text-[var(--obsidian-text-muted)]">
        <p>
          Wall Decorator is a small workshop turning sheets of steel and other materials
          into designs that turn your walls into a gallery. Every piece is laser-cut to
          the millimetre and hand-finished before it ships.
        </p>

        <p>
          We work with sizes from 1×1 ft up to 4×4 ft and offer custom dimensions on
          request. If you can sketch it, we can usually make it — start a{' '}
          <Link href="/custom-order" className="text-[var(--obsidian-gold)] hover:underline">
            custom order
          </Link>{' '}
          and we'll come back with a quote within 24 hours.
        </p>

        <p>
          We deliver across Pakistan via partner couriers, on Cash on Delivery — pay only
          when your piece arrives and you've inspected it. Read more on our{' '}
          <Link href="/shipping" className="text-[var(--obsidian-gold)] hover:underline">
            shipping
          </Link>{' '}
          and{' '}
          <Link href="/returns" className="text-[var(--obsidian-gold)] hover:underline">
            returns
          </Link>{' '}
          pages, or{' '}
          <Link href="/contact" className="text-[var(--obsidian-gold)] hover:underline">
            get in touch
          </Link>
          .
        </p>
      </section>
    </main>
  )
}
