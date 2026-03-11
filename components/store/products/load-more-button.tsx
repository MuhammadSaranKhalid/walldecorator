'use client'

import { useQueryState } from 'nuqs'
import { productSearchParams } from '@/lib/search-params/products'
import { useTransition, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

type LoadMoreProps = {
  currentPage: number
  totalCount: number
  limit: number
}

export function LoadMoreButton({
  currentPage,
  totalCount,
  limit,
}: LoadMoreProps) {
  const [isPending, startTransition] = useTransition()
  const observerTarget = useRef<HTMLDivElement>(null)

  const [page, setPage] = useQueryState(
    'page',
    productSearchParams.page.withOptions({
      shallow: false,
      startTransition,
      scroll: false, // Don't scroll to top on page change
    })
  )

  const remainingCount = totalCount - currentPage * limit

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // When the sentinel is visible and we're not already loading
        if (entries[0].isIntersecting && !isPending) {
          setPage((prev) => (prev || 1) + 1)
        }
      },
      {
        root: null, // Use viewport as root
        rootMargin: '200px', // Trigger 200px before reaching the element
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
  }, [isPending, setPage])

  return (
    <div className="mt-12 text-center space-y-4">
      {/* Invisible sentinel div for intersection observer */}
      <div ref={observerTarget} className="h-px w-full" />

      {/* Manual load more button as fallback */}
      <Button
        onClick={() => setPage((prev) => (prev || 1) + 1)}
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
  )
}
