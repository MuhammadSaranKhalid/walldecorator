import type { Metadata } from 'next'
import { Mail, Clock, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact Us | Wall Decorator',
  description: 'Get in touch with Wall Decorator about orders, custom pieces, or anything else.',
}

export default function ContactPage() {
  return (
    <main className="container mx-auto px-4 py-12 max-w-3xl text-[var(--obsidian-text)]">
      <h1 className="font-[family-name:var(--font-cormorant)] text-4xl text-[var(--obsidian-gold)] mb-2">
        Contact Us
      </h1>
      <p className="text-sm text-[var(--obsidian-text-muted)] mb-10">
        Questions about your order, a custom piece, or anything else — we'd love to hear from you.
      </p>

      <div className="grid gap-6 sm:grid-cols-1">
        <div className="bg-[var(--obsidian-surface)] border border-[var(--obsidian-border)] p-6 flex gap-4">
          <Mail className="h-5 w-5 text-[var(--obsidian-gold)] shrink-0 mt-1" />
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--obsidian-text-muted)] mb-1">
              Email
            </h2>
            <a
              href="mailto:orders@walldecorator.store"
              className="text-[var(--obsidian-text)] hover:text-[var(--obsidian-gold)] transition-colors"
            >
              orders@walldecorator.store
            </a>
            <p className="text-xs text-[var(--obsidian-text-muted)] mt-2">
              Best for: order questions, custom-order follow-ups, returns, and complaints.
            </p>
          </div>
        </div>

        <div className="bg-[var(--obsidian-surface)] border border-[var(--obsidian-border)] p-6 flex gap-4">
          <Clock className="h-5 w-5 text-[var(--obsidian-gold)] shrink-0 mt-1" />
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--obsidian-text-muted)] mb-1">
              Response time
            </h2>
            <p className="text-[var(--obsidian-text)]">
              We respond to emails within 24 hours on working days (Mon–Sat).
            </p>
          </div>
        </div>

        <div className="bg-[var(--obsidian-surface)] border border-[var(--obsidian-border)] p-6 flex gap-4">
          <MapPin className="h-5 w-5 text-[var(--obsidian-gold)] shrink-0 mt-1" />
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--obsidian-text-muted)] mb-1">
              Based in
            </h2>
            <p className="text-[var(--obsidian-text)]">Pakistan</p>
            <p className="text-xs text-[var(--obsidian-text-muted)] mt-2">
              Our workshop is in Pakistan and we ship across the country via partner couriers.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
