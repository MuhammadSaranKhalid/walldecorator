import type { Metadata } from 'next'
import Link from 'next/link'
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Shipping Information | Wall Decorator',
  description: 'How Wall Decorator ships your Cash-on-Delivery order across Pakistan.',
}

export default function ShippingPage() {
  return (
    <main className="container mx-auto px-4 py-12 max-w-3xl text-[var(--obsidian-text)]">
      <h1 className="font-[family-name:var(--font-cormorant)] text-4xl text-[var(--obsidian-gold)] mb-2">
        Shipping Information
      </h1>
      <p className="text-sm text-[var(--obsidian-text-muted)] mb-10">
        Everything you need to know about how your order reaches you.
      </p>

      <section className="space-y-8 text-[15px] leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold text-[var(--obsidian-gold)] mb-2">
            Where we deliver
          </h2>
          <p className="text-[var(--obsidian-text-muted)]">
            We ship across Pakistan via partner couriers. Major cities (Karachi,
            Lahore, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar) are typically
            delivered within 3–5 working days after dispatch. Remote areas and
            northern regions may take 5–9 working days.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--obsidian-gold)] mb-2">
            Shipping cost
          </h2>
          <ul className="space-y-2 text-[var(--obsidian-text-muted)] list-disc list-inside">
            <li>
              Flat rate: <span className="text-[var(--obsidian-text)] font-medium">Rs. {SHIPPING_COST.toLocaleString('en-PK')}</span> per order
            </li>
            <li>
              <span className="text-[var(--obsidian-gold)] font-medium">Free shipping</span> on orders above Rs.{' '}
              {FREE_SHIPPING_THRESHOLD.toLocaleString('en-PK')}
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--obsidian-gold)] mb-2">
            How Cash on Delivery works
          </h2>
          <ol className="space-y-2 text-[var(--obsidian-text-muted)] list-decimal list-inside">
            <li>You place your order — no online payment required.</li>
            <li>Our team prepares your order and hands it to a partner courier.</li>
            <li>The courier calls you on the phone number you provided to schedule delivery.</li>
            <li>You receive the order and pay the courier in cash.</li>
          </ol>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--obsidian-gold)] mb-2">
            Tracking your order
          </h2>
          <p className="text-[var(--obsidian-text-muted)]">
            Once your order is dispatched, you can check its status on the{' '}
            <Link href="/track-order" className="text-[var(--obsidian-gold)] hover:underline">
              Track Order page
            </Link>{' '}
            using your order number and the email used at checkout. Your order
            confirmation email also contains a direct tracking link.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--obsidian-gold)] mb-2">
            Missed a courier call?
          </h2>
          <p className="text-[var(--obsidian-text-muted)]">
            If the courier was unable to reach you, please{' '}
            <Link href="/contact" className="text-[var(--obsidian-gold)] hover:underline">
              get in touch
            </Link>{' '}
            with us and we'll coordinate redelivery.
          </p>
        </div>
      </section>
    </main>
  )
}
