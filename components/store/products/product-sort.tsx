'use client'

import { useQueryState } from 'nuqs'
import { productSearchParams, sortOptions } from '@/lib/search-params/products'
import { useTransition } from 'react'
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

export function ProductSort({ currentSort }: { currentSort: string }) {
  const [isPending, startTransition] = useTransition()

  const [sort, setSort] = useQueryState(
    'sort',
    productSearchParams.sort.withOptions({ shallow: false, startTransition })
  )

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Sort by:</span>
      <Select
        value={sort}
        onValueChange={(value) => setSort(value as (typeof sortOptions)[number])}
        disabled={isPending}
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
