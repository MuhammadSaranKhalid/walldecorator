'use client'

import { useQueryState } from 'nuqs'
import { productSearchParams } from '@/lib/search-params/products'
import { useTransition } from 'react'
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

  const [page, setPage] = useQueryState(
    'page',
    productSearchParams.page.withOptions({
      shallow: false,
      startTransition,
      scroll: false, // Don't scroll to top on page change
    })
  )

  const remainingCount = totalCount - currentPage * limit

  return (
    <div className="mt-12 text-center">
      <Button
        onClick={() => setPage(currentPage + 1)}
        disabled={isPending}
        size="lg"
        className="px-8"
      >
        {isPending
          ? 'Loading...'
          : `Load More (${remainingCount} remaining)`}
      </Button>
    </div>
  )
}
