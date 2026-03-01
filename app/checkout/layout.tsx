import Link from 'next/link'

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal header - logo only */}
      {/* <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <Link href="/" className="flex justify-center">
            <h1 className="logo-text text-3xl font-bold text-brand-navy italic hover:text-brand-gold transition-colors">
              WD
            </h1>
          </Link>
        </div>
      </header> */}

      {/* Main content */}
      <main>{children}</main>

      {/* Minimal footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-600">
            <p>&copy; {new Date().getFullYear()} Wall Decorator. All rights reserved.</p>
            <div className="flex items-center justify-center gap-4 mt-3">
              <Link href="/about" className="hover:text-brand-navy transition-colors">About</Link>
              <span>&bull;</span>
              <Link href="/track-order" className="hover:text-brand-navy transition-colors">Track Order</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
