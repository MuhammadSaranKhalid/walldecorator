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
      clear: () => setParams({ category: null, page: null }),
    },
    params.minPrice > 0 && {
      key: 'minPrice',
      label: `Min: Rs. ${params.minPrice.toLocaleString()}`,
      clear: () => setParams({ minPrice: null, page: null }),
    },
    params.maxPrice > 0 && {
      key: 'maxPrice',
      label: `Max: Rs. ${params.maxPrice.toLocaleString()}`,
      clear: () => setParams({ maxPrice: null, page: null }),
    },
    ...params.colors.map((c) => ({
      key: `color-${c}`,
      label: `Color: ${c}`,
      clear: () => {
        const next = params.colors.filter((x) => x !== c)
        setParams({ colors: next.length > 0 ? next : null, page: null })
      },
    })),
    ...params.sizes.map((s) => ({
      key: `size-${s}`,
      label: `Size: ${s}`,
      clear: () => {
        const next = params.sizes.filter((x) => x !== s)
        setParams({ sizes: next.length > 0 ? next : null, page: null })
      },
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
