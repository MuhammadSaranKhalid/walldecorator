'use client'

import { useQueryStates } from 'nuqs'
import { productSearchParams } from '@/lib/search-params/products'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import type { Category, FilterAttribute } from '@/types/products'

type FilterSidebarProps = {
  categories: Category[]
}

export function FilterSidebar({
  categories,
}: FilterSidebarProps) {
  // useTransition gives us a pending state while the server re-renders
  const [isPending, startTransition] = useTransition()

  // nuqs hook — syncs all filter state with the URL at once
  const [params, setParams] = useQueryStates(productSearchParams, {
    // shallow: false means URL changes trigger a server re-render
    shallow: false,
    startTransition,
  })

  function handleCategoryChange(slug: string) {
    setParams({
      category: slug === params.category ? null : slug,
      page: null, // Reset to page 1 implicitly by clearing page from URL
    })
  }

  function handlePriceChange(values: number[]) {
    setParams({
      minPrice: values[0] === 0 ? null : values[0],
      maxPrice: values[1] === 50000 ? null : values[1],
      page: null,
    })
  }

  function handleClearAll() {
    setParams({
      category: null,
      minPrice: null,
      maxPrice: null,
      colors: null,
      sizes: null,
      page: null,
    })
  }

  const hasActiveFilters =
    params.category ||
    params.minPrice > 0 ||
    params.maxPrice > 0 ||
    params.colors.length > 0 ||
    params.sizes.length > 0



  return (
    <div className={isPending ? 'opacity-50 pointer-events-none' : ''}>
      <div className="sticky top-4 space-y-6">
        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="w-full"
          >
            Clear All Filters
          </Button>
        )}

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="border-b pb-6">
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-primary">
              Category
            </h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.slug)}
                  className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${params.category === cat.slug
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'hover:bg-secondary'
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price Range Filter */}
        <div className="border-b pb-6">
          <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-primary">
            Price Range
          </h3>
          <div className="space-y-4">
            <Slider
              min={0}
              max={50000}
              step={500}
              value={[params.minPrice, params.maxPrice || 50000]}
              onValueChange={handlePriceChange}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Rs. {params.minPrice.toLocaleString()}</span>
              <span>
                Rs. {(params.maxPrice || 50000).toLocaleString()}
              </span>
            </div>
          </div>
        </div>


      </div>
    </div>
  )
}
