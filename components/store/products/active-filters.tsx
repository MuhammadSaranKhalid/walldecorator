'use client'

import { useMemo, useTransition } from 'react'
import { useQueryStates } from 'nuqs'
import { productSearchParams } from '@/lib/search-params/products'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function ActiveFilters() {
  const [isPending, startTransition] = useTransition()
  const [params, setParams] = useQueryStates(productSearchParams, {
    shallow: false,
    startTransition,
  })

  // Memoize — rebuilds only when URL params actually change
  const activeFilters = useMemo(() => [
    params.category ? {
      key: 'category',
      label: `Category: ${params.category}`,
      clear: () => setParams({ category: null, page: null }),
    } : null,
  ].filter(Boolean) as Array<{ key: string; label: string; clear: () => void }>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params.category])

  if (activeFilters.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {activeFilters.map((filter) => (
        <Badge
          key={filter.key}
          variant="secondary"
          className="pl-3 pr-2 py-1.5 cursor-pointer hover:bg-gray-200"
          onClick={filter.clear}
        >
          <span className="text-sm">{filter.label}</span>
          <X size={14} className="ml-1.5" />
        </Badge>
      ))}
    </div>
  )
}
