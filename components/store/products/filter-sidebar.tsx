'use client'

import { useQueryStates } from 'nuqs'
import { productSearchParams } from '@/lib/search-params/products'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import type { Category } from '@/types/products'

type FilterSidebarProps = {
  categories: Category[]
}

type CategoryTreeProps = {
  category: Category
  level: number
  selectedSlug: string | null
  onSelect: (slug: string) => void
}

function CategoryTree({ category, level, selectedSlug, onSelect }: CategoryTreeProps) {
  const hasChildren = category.other_categories && category.other_categories.length > 0
  const isSelected = selectedSlug === category.slug

  return (
    <div>
      <button
        onClick={() => onSelect(category.slug)}
        className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${
          isSelected
            ? 'bg-primary text-primary-foreground font-medium'
            : 'hover:bg-secondary'
        }`}
        style={{ paddingLeft: `${(level * 1) + 0.75}rem` }}
      >
        {category.name}
      </button>

      {hasChildren && (
        <div className="mt-1 space-y-1">
          {category.other_categories?.map((subCat) => (
            <CategoryTree
              key={subCat.id}
              category={subCat as any}
              level={level + 1}
              selectedSlug={selectedSlug}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
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

  function handleClearAll() {
    setParams({
      category: null,
      page: null,
    })
  }

  const hasActiveFilters = params.category



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
                <CategoryTree
                  key={cat.id}
                  category={cat}
                  level={0}
                  selectedSlug={params.category}
                  onSelect={handleCategoryChange}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
