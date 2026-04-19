import Link from 'next/link'

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[var(--obsidian-bg)]">
      <main>{children}</main>
      <footer className="bg-[var(--obsidian-surface)] border-t border-[var(--obsidian-border)] mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-[var(--obsidian-text-muted)]">
            <p>&copy; {new Date().getFullYear()} Wall Decorator. All rights reserved.</p>
            <div className="flex items-center justify-center gap-4 mt-3">
              <Link href="/products" className="hover:text-[var(--obsidian-gold)] transition-colors">Shop</Link>
              <span>&bull;</span>
              <Link href="/track-order" className="hover:text-[var(--obsidian-gold)] transition-colors">Track Order</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
