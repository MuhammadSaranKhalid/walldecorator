import Link from 'next/link'
import { ProductRow } from '@/components/store/product/product-row'
import type { HomepageProduct } from '@/types/homepage'

type FeaturedProductsProps = {
  products: HomepageProduct[]
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Handpicked
            </p>
            <h2 className="text-3xl font-bold text-gray-900">
              Featured Products
            </h2>
          </div>
          <Link
            href="/products?sort=newest"
            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            See All →
          </Link>
        </div>
        <ProductRow products={products} priority={false} />
      </div>
    </section>
  )
}
