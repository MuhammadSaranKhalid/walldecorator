import Link from 'next/link'
import { ProductRow } from '@/components/store/product/product-row'
import type { HomepageProduct } from '@/types/homepage'

type FeaturedProductsProps = {
  products: HomepageProduct[]
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  return (
    <section className="py-16 bg-secondary/50">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-1">
              Handpicked
            </p>
            <h2 className="text-3xl font-bold text-primary">
              Featured Products
            </h2>
          </div>
          <Link
            href="/products?sort=newest"
            className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors"
          >
            See All →
          </Link>
        </div>
        <ProductRow products={products} priority={false} />
      </div>
    </section>
  )
}
