import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="container mx-auto px-4 py-24 max-w-lg text-center text-[var(--obsidian-text)]">
      <p className="text-xs tracking-[0.2em] uppercase text-[var(--obsidian-text-muted)] mb-4">
        404
      </p>
      <h1 className="font-[family-name:var(--font-cormorant)] text-4xl text-[var(--obsidian-gold)] mb-4">
        Page not found
      </h1>
      <p className="text-sm text-[var(--obsidian-text-muted)] mb-8">
        The page you were looking for doesn't exist or was moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="px-6 py-3 bg-[var(--obsidian-gold)] text-[var(--obsidian-bg)] text-[11px] tracking-[0.1875em] uppercase font-medium hover:bg-[var(--obsidian-gold-light)] transition-colors"
        >
          Go home
        </Link>
        <Link
          href="/products"
          className="px-6 py-3 border border-[var(--obsidian-border)] text-[var(--obsidian-text)] text-[11px] tracking-[0.1875em] uppercase font-medium hover:border-[var(--obsidian-gold)] hover:text-[var(--obsidian-gold)] transition-colors"
        >
          Browse products
        </Link>
      </div>
    </main>
  )
}
