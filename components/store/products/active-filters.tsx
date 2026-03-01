'use client'

import { useQueryStates } from 'nuqs'
import { productSearchParams } from '@/lib/search-params/products'
import { useTransition } from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function ActiveFilters() {
  const [isPending, startTransition] = useTransition()
  const [params, setParams] = useQueryStates(productSearchParams, {
    shallow: false,
    startTransition,
  })

  const activeFilters = [
    params.category && {
      key: 'category',
      label: `Category: ${params.category}`,
      clear: () => setParams({ category: '', page: 1 }),
    },
    params.minPrice > 0 && {
      key: 'minPrice',
      label: `Min: Rs. ${params.minPrice.toLocaleString()}`,
      clear: () => setParams({ minPrice: 0, page: 1 }),
    },
    params.maxPrice > 0 && {
      key: 'maxPrice',
      label: `Max: Rs. ${params.maxPrice.toLocaleString()}`,
      clear: () => setParams({ maxPrice: 0, page: 1 }),
    },
    ...params.colors.map((c) => ({
      key: `color-${c}`,
      label: `Color: ${c}`,
      clear: () =>
        setParams({ colors: params.colors.filter((x) => x !== c), page: 1 }),
    })),
    ...params.sizes.map((s) => ({
      key: `size-${s}`,
      label: `Size: ${s}`,
      clear: () =>
        setParams({ sizes: params.sizes.filter((x) => x !== s), page: 1 }),
    })),
  ].filter(Boolean) as Array<{ key: string; label: string; clear: () => void }>

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
