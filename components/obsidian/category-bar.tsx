'use client'

import { useState } from 'react'

interface Category {
  id: string
  name: string
  slug: string
  subcategories?: Array<{
    id: string
    name: string
    slug: string
  }>
}

interface CategoryBarProps {
  categories: Category[]
  activeCategory?: string
  onCategoryChange?: (categorySlug: string) => void
}

export function CategoryBar({ categories, activeCategory, onCategoryChange }: CategoryBarProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(activeCategory || 'all')

  const handleCategoryClick = (slug: string) => {
    setSelectedCategory(slug)
    onCategoryChange?.(slug)
  }

  return (
    <div className="border-b border-[var(--obsidian-border)] px-6 sm:px-12 flex items-center overflow-x-auto obsidian-scrollbar">
      {/* All Products */}
      <button
        onClick={() => handleCategoryClick('all')}
        className={`bg-transparent border-none border-b-2 px-6 py-4.5 font-[family-name:var(--font-dm-sans)] text-[11px] tracking-[0.125em] uppercase cursor-pointer whitespace-nowrap transition-all duration-200 -mb-px ${
          selectedCategory === 'all'
            ? 'text-[var(--obsidian-gold)] border-[var(--obsidian-gold)]'
            : 'text-[var(--obsidian-text-muted)] border-transparent hover:text-[var(--obsidian-text)]'
        }`}
      >
        All
      </button>

      {/* Categories */}
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => handleCategoryClick(category.slug)}
          className={`bg-transparent border-none border-b-2 px-6 py-4.5 font-[family-name:var(--font-dm-sans)] text-[11px] tracking-[0.125em] uppercase cursor-pointer whitespace-nowrap transition-all duration-200 -mb-px ${
            selectedCategory === category.slug
              ? 'text-[var(--obsidian-gold)] border-[var(--obsidian-gold)]'
              : 'text-[var(--obsidian-text-muted)] border-transparent hover:text-[var(--obsidian-text)]'
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}

interface SubcategoryBarProps {
  subcategories: Array<{
    id: string
    name: string
    slug: string
  }>
  activeSubcategory?: string
  onSubcategoryChange?: (subcategorySlug: string) => void
  visible?: boolean
}

export function SubcategoryBar({
  subcategories,
  activeSubcategory,
  onSubcategoryChange,
  visible = true,
}: SubcategoryBarProps) {
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(
    activeSubcategory || 'all'
  )

  const handleSubcategoryClick = (slug: string) => {
    setSelectedSubcategory(slug)
    onSubcategoryChange?.(slug)
  }

  if (!visible || subcategories.length === 0) return null

  return (
    <div className="border-b border-[var(--obsidian-border)] px-6 sm:px-12 flex items-center gap-0 bg-[rgba(17,17,17,0.6)] overflow-x-auto obsidian-scrollbar">
      {/* All Subcategory */}
      <button
        onClick={() => handleSubcategoryClick('all')}
        className={`bg-transparent border-none border-b-2 px-4.5 py-3 font-[family-name:var(--font-dm-sans)] text-[10px] tracking-[0.09375em] uppercase cursor-pointer whitespace-nowrap transition-all duration-200 -mb-px ${
          selectedSubcategory === 'all'
            ? 'text-[var(--obsidian-gold)] border-[var(--obsidian-gold)]'
            : 'text-[var(--obsidian-text-dim)] border-transparent hover:text-[var(--obsidian-text-muted)]'
        }`}
      >
        All
      </button>

      {/* Subcategories */}
      {subcategories.map((subcategory) => (
        <button
          key={subcategory.id}
          onClick={() => handleSubcategoryClick(subcategory.slug)}
          className={`bg-transparent border-none border-b-2 px-4.5 py-3 font-[family-name:var(--font-dm-sans)] text-[10px] tracking-[0.09375em] uppercase cursor-pointer whitespace-nowrap transition-all duration-200 -mb-px ${
            selectedSubcategory === subcategory.slug
              ? 'text-[var(--obsidian-gold)] border-[var(--obsidian-gold)]'
              : 'text-[var(--obsidian-text-dim)] border-transparent hover:text-[var(--obsidian-text-muted)]'
          }`}
        >
          {subcategory.name}
        </button>
      ))}
    </div>
  )
}

interface ResultsBarProps {
  totalResults: number
  currentFilter?: string
  currentCategory?: string
  currentSubcategory?: string
}

export function ResultsBar({
  totalResults,
  currentFilter,
  currentCategory,
  currentSubcategory,
}: ResultsBarProps) {
  return (
    <div className="flex items-center justify-between px-6 sm:px-12 py-3.5 border-b border-[var(--obsidian-border)] bg-[rgba(8,8,8,0.4)]">
      {/* Results Info */}
      <div className="text-[11px] text-[var(--obsidian-text-muted)] tracking-wide">
        Showing <strong className="text-[var(--obsidian-text)]">{totalResults}</strong> results
      </div>

      {/* Breadcrumb */}
      {(currentCategory || currentSubcategory) && (
        <div className="flex items-center gap-2 text-[10px] text-[var(--obsidian-text-dim)] tracking-wide uppercase">
          {currentCategory && (
            <>
              <span className="text-[var(--obsidian-gold)]">{currentCategory}</span>
              {currentSubcategory && (
                <>
                  <span>/</span>
                  <span className="text-[var(--obsidian-gold)]">{currentSubcategory}</span>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
