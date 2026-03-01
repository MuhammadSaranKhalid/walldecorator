import Link from 'next/link'

export default function ProductNotFound() {
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-primary mb-4">Product Not Found</h1>
        <p className="text-muted-foreground mb-8">
          This product doesn't exist or has been removed from our catalog.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/products"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg"
          >
            Browse All Products
          </Link>
          <Link
            href="/"
            className="px-6 py-3 border border-border text-foreground rounded-xl font-medium hover:border-accent transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
