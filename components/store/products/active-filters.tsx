'use client'

import { useMemo } from 'react'
import { useProductFilters } from '@/components/store/products/product-filters-provider'
import { X } from 'lucide-react'

export function ActiveFilters() {
  const { params, setParams } = useProductFilters()

  // Memoize — rebuilds only when URL params actually change
  const activeFilters = useMemo(() => [
    params.category ? {
      key: 'category',
      label: `Category: ${params.category}`,
      clear: () => setParams({ category: null, page: null }),
    } : null,
  ].filter(Boolean) as Array<{ key: string; label: string; clear: () => void }>,
    [params.category, setParams])

  if (activeFilters.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {activeFilters.map((filter) => (
        <button
          key={filter.key}
          onClick={filter.clear}
          aria-label={`Remove filter: ${filter.label}`}
          className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm hover:bg-gray-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none transition-colors"
        >
          {filter.label}
          <X size={14} aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}
