import Link from 'next/link'
import { ProductRow } from '@/components/store/product/product-row'
import type { HomepageProduct } from '@/types/homepage'

type NewArrivalsProps = {
  products: HomepageProduct[]
}

export function NewArrivals({ products }: NewArrivalsProps) {
  if (products.length === 0) return null

  return (
    <section className="py-16 bg-secondary/50">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-1">
              Just In
            </p>
            <h2 className="text-3xl font-bold text-primary">New Arrivals</h2>
          </div>
          <Link
            href="/products?sort=newest"
            className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors"
          >
            See All →
          </Link>
        </div>
        <ProductRow products={products} badge="New" priority={false} />
      </div>
    </section>
  )
}
