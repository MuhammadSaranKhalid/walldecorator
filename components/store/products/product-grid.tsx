'use client'

import { useProductFilters } from '@/components/store/products/product-filters-provider'
import { ProductCard } from './product-card'
import { PaginationControls } from './pagination-controls'
import type { ProductListing } from '@/types/products'

type ProductGridProps = {
  initialProducts: ProductListing[]
  totalPages: number
  currentPage: number
}

export function ProductGrid({
  initialProducts,
  totalPages,
  currentPage,
}: ProductGridProps) {
  const { isPending } = useProductFilters()

  if (initialProducts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg font-medium">No products found.</p>
        <p className="text-sm text-gray-400 mt-1">Try adjusting your filters.</p>
      </div>
    )
  }

  return (
    <div className={isPending ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}>
      <div
        className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
        style={{ contentVisibility: 'auto' }}
      >
        {initialProducts.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={index < 4}
          />
        ))}
      </div>

      <PaginationControls currentPage={currentPage} totalPages={totalPages} />
    </div>
  )
}
