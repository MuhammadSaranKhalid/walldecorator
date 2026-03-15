'use client'

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import { useProductFilters } from '@/components/store/products/product-filters-provider'
import { serializeProductParams } from '@/lib/search-params/products'

type PaginationControlsProps = {
  currentPage: number
  totalPages: number
}

/** Returns page numbers with 'ellipsis' markers for gaps. */
function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = new Set<number>([1, total, current])
  if (current > 1) pages.add(current - 1)
  if (current < total) pages.add(current + 1)

  const sorted = Array.from(pages).sort((a, b) => a - b)
  const result: (number | 'ellipsis')[] = []

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('ellipsis')
    result.push(sorted[i])
  }

  return result
}

export function PaginationControls({ currentPage, totalPages }: PaginationControlsProps) {
  const { params, setParams } = useProductFilters()

  if (totalPages <= 1) return null

  function goToPage(page: number) {
    setParams({ page })
    // Scroll to top of product grid
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const pageNumbers = getPageNumbers(currentPage, totalPages)

  return (
    <Pagination className="mt-10">
      <PaginationContent>

        {/* Previous */}
        <PaginationItem>
          <PaginationPrevious
            href={serializeProductParams({ ...params, page: currentPage - 1 })}
            onClick={(e) => { e.preventDefault(); if (currentPage > 1) goToPage(currentPage - 1) }}
            aria-disabled={currentPage <= 1}
            className={currentPage <= 1 ? 'pointer-events-none opacity-40' : ''}
          />
        </PaginationItem>

        {/* Page numbers */}
        {pageNumbers.map((item, i) =>
          item === 'ellipsis' ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationLink
                href={serializeProductParams({ ...params, page: item })}
                onClick={(e) => { e.preventDefault(); goToPage(item) }}
                isActive={item === currentPage}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        {/* Next */}
        <PaginationItem>
          <PaginationNext
            href={serializeProductParams({ ...params, page: currentPage + 1 })}
            onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) goToPage(currentPage + 1) }}
            aria-disabled={currentPage >= totalPages}
            className={currentPage >= totalPages ? 'pointer-events-none opacity-40' : ''}
          />
        </PaginationItem>

      </PaginationContent>
    </Pagination>
  )
}
