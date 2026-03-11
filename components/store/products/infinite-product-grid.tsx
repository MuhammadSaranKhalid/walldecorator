'use client'

import { useState, useEffect, useTransition, useRef, useCallback } from 'react'
import { useQueryStates } from 'nuqs'
import { productSearchParams } from '@/lib/search-params/products'
import { loadMoreProducts } from '@/actions/products'
import { ProductCard } from './product-card'
import { Button } from '@/components/ui/button'
import type { ProductVariant } from '@/types/products'

type InfiniteProductGridProps = {
  initialProducts: ProductVariant[]
  initialPage: number
  totalCount: number
  limit: number
}

export function InfiniteProductGrid({
  initialProducts,
  initialPage,
  totalCount,
  limit,
}: InfiniteProductGridProps) {
  const [products, setProducts] = useState<ProductVariant[]>(initialProducts)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [isPending, startTransition] = useTransition()
  const observerTarget = useRef<HTMLDivElement>(null)

  const [searchParams] = useQueryStates(productSearchParams)

  const hasMore = currentPage * limit < totalCount
  const remainingCount = Math.max(0, totalCount - currentPage * limit)

  // Reset products when filters change
  useEffect(() => {
    setProducts(initialProducts)
    setCurrentPage(initialPage)
  }, [
    searchParams.category,
    searchParams.sort,
    initialProducts,
    initialPage,
  ])

  // Load more products - memoized to prevent unnecessary re-renders in IntersectionObserver
  const loadMore = useCallback(async () => {
    if (!hasMore || isPending) return

    startTransition(async () => {
      const nextPage = currentPage + 1
      const result = await loadMoreProducts({
        category: searchParams.category,
        sort: searchParams.sort,
        page: String(nextPage),
        limit: String(searchParams.limit),
      })

      setProducts((prev) => [...prev, ...result.items])
      setCurrentPage(nextPage)
    })
  }, [hasMore, isPending, currentPage, searchParams.category, searchParams.sort, searchParams.limit])

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    if (!hasMore || isPending) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0.1,
      }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [loadMore, hasMore, isPending])

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
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {products.map((variant, index) => (
          <ProductCard
            key={variant.id}
            variant={variant}
            priority={index < 4}
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-12 text-center space-y-4">
          {/* Invisible sentinel div for intersection observer */}
          <div ref={observerTarget} className="h-px w-full" />

          {/* Manual load more button as fallback */}
          <Button
            onClick={loadMore}
            disabled={isPending}
            size="lg"
            variant="outline"
            className="px-8"
          >
            {isPending
              ? 'Loading...'
              : `Load More (${remainingCount} remaining)`}
          </Button>
        </div>
      )}
    </div>
  )
}
