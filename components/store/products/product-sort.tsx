'use client'

import { sortOptions } from '@/lib/search-params/products'
import { useProductFilters } from '@/components/store/products/product-filters-provider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const sortLabels: Record<(typeof sortOptions)[number], string> = {
  newest: 'Newest',
  'price-asc': 'Price: Low to High',
  'price-desc': 'Price: High to Low',
  popularity: 'Most Popular',
}

export function ProductSort() {
  const { params, setParams, isPending } = useProductFilters()

  return (
    <div className="flex items-center gap-2">
      <label id="sort-label" className="text-sm text-gray-600">Sort by:</label>
      <Select
        value={params.sort}
        onValueChange={(value) =>
          setParams({ sort: value as (typeof sortOptions)[number], page: null })
        }
        disabled={isPending}
        aria-labelledby="sort-label"
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {sortLabels[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
