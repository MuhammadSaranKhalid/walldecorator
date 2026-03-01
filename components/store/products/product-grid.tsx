// Product Grid - Server Component
import { ProductCard } from './product-card'
import { LoadMoreButton } from './load-more-button'
import type { ProductVariant } from '@/types/products'

type ProductGridProps = {
  products: ProductVariant[]
  totalCount: number
  currentPage: number
  limit: number
}

export function ProductGrid({
  products,
  totalCount,
  currentPage,
  limit,
}: ProductGridProps) {
  const hasMore = currentPage * limit < totalCount

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg font-medium">No products found.</p>
        <p className="text-sm text-gray-400 mt-1">Try adjusting your filters.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((variant, index) => (
          <ProductCard
            key={variant.id}
            variant={variant}
            priority={index < 4} // Prioritize first 4 images for LCP
          />
        ))}
      </div>

      {/* Load more / pagination */}
      {hasMore && (
        <LoadMoreButton
          currentPage={currentPage}
          totalCount={totalCount}
          limit={limit}
        />
      )}
    </div>
  )
}
