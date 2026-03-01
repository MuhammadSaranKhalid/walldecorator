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
  attributes: FilterAttribute[]
}

export function FilterSidebar({
  categories,
  attributes,
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
      category: slug === params.category ? '' : slug,
      page: 1, // Reset to page 1 on filter change
    })
  }

  function handlePriceChange(values: number[]) {
    setParams({
      minPrice: values[0],
      maxPrice: values[1],
      page: 1,
    })
  }

  function handleColorToggle(color: string) {
    const current = params.colors
    const updated = current.includes(color)
      ? current.filter((c) => c !== color)
      : [...current, color]
    setParams({ colors: updated, page: 1 })
  }

  function handleSizeToggle(size: string) {
    const current = params.sizes
    const updated = current.includes(size)
      ? current.filter((s) => s !== size)
      : [...current, size]
    setParams({ sizes: updated, page: 1 })
  }

  function handleClearAll() {
    setParams({
      category: '',
      minPrice: 0,
      maxPrice: 0,
      colors: [],
      sizes: [],
      page: 1,
    })
  }

  const hasActiveFilters =
    params.category ||
    params.minPrice > 0 ||
    params.maxPrice > 0 ||
    params.colors.length > 0 ||
    params.sizes.length > 0

  const colorAttributes = attributes.find((a) => a.name === 'Color')
  const sizeAttributes = attributes.find((a) => a.name === 'Size')

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
                  className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    params.category === cat.slug
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

        {/* Color Filter */}
        {colorAttributes && colorAttributes.values.length > 0 && (
          <div className="border-b pb-6">
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-primary">
              Color
            </h3>
            <div className="space-y-2">
              {colorAttributes.values.map((color) => (
                <label
                  key={color}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={params.colors.includes(color)}
                    onCheckedChange={() => handleColorToggle(color)}
                  />
                  <span className="text-sm capitalize">{color}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Size Filter */}
        {sizeAttributes && sizeAttributes.values.length > 0 && (
          <div className="pb-6">
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-primary">
              Size
            </h3>
            <div className="flex flex-wrap gap-2">
              {sizeAttributes.values.map((size) => (
                <button
                  key={size}
                  onClick={() => handleSizeToggle(size)}
                  className={`px-4 py-2 border rounded text-sm transition-colors ${
                    params.sizes.includes(size)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:border-accent'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
