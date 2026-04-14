'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { ObsidianProductCard } from './product-card'
import type { CategoryWithSubs } from '@/types/products'

interface ProductsPageProps {
  initialProducts: any[]
  categories: CategoryWithSubs[]
  totalCount: number
  currentPage: number
  totalPages: number
  currentCategory: string
  currentSort: string
}

export function ObsidianProductsPage({
  initialProducts,
  categories,
  totalCount,
  currentPage,
  totalPages,
  currentCategory,
  currentSort,
}: ProductsPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Derive active parent + subcategory from URL
  const activeParent = categories.find(
    (cat) =>
      cat.slug === currentCategory ||
      cat.subcategories.some((sub) => sub.slug === currentCategory)
  )
  const activeSubSlug =
    activeParent && activeParent.slug !== currentCategory ? currentCategory : null

  const navigate = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })
      // Reset to page 1 on filter change
      params.delete('page')
      router.push(`/products?${params.toString()}`)
    },
    [router, searchParams]
  )

  const handleCategoryClick = (slug: string | null) => {
    navigate({ category: slug ?? '' })
  }

  const handleSubcategoryClick = (slug: string) => {
    navigate({ category: slug })
  }

  const handleSortChange = (sort: string) => {
    navigate({ sort })
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`/products?${params.toString()}`)
  }

  return (
    <div className="relative z-[1]">
      {/* ── Category Bar ─────────────────────────────────────────────────── */}
      <div className="border-b border-[var(--obsidian-border)] px-6 sm:px-12 flex items-center overflow-x-auto obsidian-scrollbar">
        {/* All */}
        <button
          onClick={() => handleCategoryClick(null)}
          className={`bg-transparent border-none border-b-2 px-6 py-4 font-[family-name:var(--font-dm-sans)] text-[11px] tracking-[0.125em] uppercase cursor-pointer whitespace-nowrap transition-all duration-200 -mb-px ${
            !currentCategory
              ? 'text-[var(--obsidian-gold)] border-[var(--obsidian-gold)]'
              : 'text-[var(--obsidian-text-muted)] border-transparent hover:text-[var(--obsidian-text)]'
          }`}
        >
          All
        </button>

        {categories.map((cat) => {
          const isActive =
            cat.slug === currentCategory ||
            cat.subcategories.some((sub) => sub.slug === currentCategory)
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.slug)}
              className={`bg-transparent border-none border-b-2 px-6 py-4 font-[family-name:var(--font-dm-sans)] text-[11px] tracking-[0.125em] uppercase cursor-pointer whitespace-nowrap transition-all duration-200 -mb-px ${
                isActive
                  ? 'text-[var(--obsidian-gold)] border-[var(--obsidian-gold)]'
                  : 'text-[var(--obsidian-text-muted)] border-transparent hover:text-[var(--obsidian-text)]'
              }`}
            >
              {cat.name}
            </button>
          )
        })}
      </div>

      {/* ── Subcategory Bar — only when parent has subcategories ─────────── */}
      {activeParent && activeParent.subcategories.length > 0 && (
        <div className="border-b border-[var(--obsidian-border)] px-6 sm:px-12 flex items-center gap-0 bg-[rgba(17,17,17,0.6)] overflow-x-auto obsidian-scrollbar">
          {/* All (parent) */}
          <button
            onClick={() => handleCategoryClick(activeParent.slug)}
            className={`bg-transparent border-none border-b-2 px-5 py-3 font-[family-name:var(--font-dm-sans)] text-[10px] tracking-[0.09375em] uppercase cursor-pointer whitespace-nowrap transition-all duration-200 -mb-px ${
              !activeSubSlug
                ? 'text-[var(--obsidian-gold)] border-[var(--obsidian-gold)]'
                : 'text-[var(--obsidian-text-dim)] border-transparent hover:text-[var(--obsidian-text-muted)]'
            }`}
          >
            All {activeParent.name}
          </button>

          {activeParent.subcategories.map((sub) => (
            <button
              key={sub.id}
              onClick={() => handleSubcategoryClick(sub.slug)}
              className={`bg-transparent border-none border-b-2 px-5 py-3 font-[family-name:var(--font-dm-sans)] text-[10px] tracking-[0.09375em] uppercase cursor-pointer whitespace-nowrap transition-all duration-200 -mb-px ${
                activeSubSlug === sub.slug
                  ? 'text-[var(--obsidian-gold)] border-[var(--obsidian-gold)]'
                  : 'text-[var(--obsidian-text-dim)] border-transparent hover:text-[var(--obsidian-text-muted)]'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Results / Sort Bar ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-y-2 px-6 sm:px-12 py-3 border-b border-[var(--obsidian-border)] bg-[var(--obsidian-surface2)]">
        <div className="text-[11px] text-[var(--obsidian-text-muted)] tracking-wide">
          Showing <strong className="text-[var(--obsidian-text)]">{totalCount}</strong> results
          {activeParent && (
            <span className="ml-2 text-[var(--obsidian-gold)]">
              — {activeSubSlug
                ? activeParent.subcategories.find((s) => s.slug === activeSubSlug)?.name
                : activeParent.name}
            </span>
          )}
        </div>

        <select
          value={currentSort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="bg-[var(--obsidian-surface)] border border-[var(--obsidian-border)] text-[var(--obsidian-text-muted)] px-3 py-1.5 font-[family-name:var(--font-dm-sans)] text-[11px] cursor-pointer outline-none"
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
          <option value="popularity">Most Popular</option>
        </select>
      </div>

      {/* ── Products Grid ─────────────────────────────────────────────────── */}
      <section className="sm:px-12 py-12">
        <div className="flex items-end justify-between mb-10 px-6 sm:px-0">
          <div className="font-[family-name:var(--font-cormorant)] text-[clamp(26px,5vw,42px)] font-light leading-tight">
            {activeParent
              ? activeSubSlug
                ? activeParent.subcategories.find((s) => s.slug === activeSubSlug)?.name
                : activeParent.name
              : 'Wall Art'}{' '}
            {totalCount > 0 && (
              <span className="text-[var(--obsidian-text-muted)] italic font-[family-name:var(--font-cormorant)] text-[28px] font-light">
                ({totalCount})
              </span>
            )}
          </div>
        </div>

        {initialProducts.length === 0 ? (
          <div className="text-center py-20 text-[var(--obsidian-text-muted)] text-xs tracking-[2px] uppercase">
            No pieces found
          </div>
        ) : (
          <div className="grid gap-[2px] grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {initialProducts.map((product, index) => (
              <ObsidianProductCard
                key={product.id}
                product={product}
                animationDelay={index * 50}
              />
            ))}
          </div>
        )}

        {/* ── Pagination ───────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center pt-12 gap-4 px-6 sm:px-0">
            {/* Progress bar */}
            <div className="w-[200px] h-px bg-[var(--obsidian-border)] relative overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-[var(--obsidian-gold)] transition-[width] duration-400"
                style={{ width: `${(currentPage / totalPages) * 100}%` }}
              />
            </div>
            <div className="text-[10px] text-[var(--obsidian-text-dim)] tracking-[1px]">
              Page {currentPage} of {totalPages}
            </div>

            <div className="flex items-center gap-2">
              {currentPage > 1 && (
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="bg-transparent border border-[var(--obsidian-border)] text-[var(--obsidian-text-muted)] px-5 py-3 cursor-pointer font-[family-name:var(--font-dm-sans)] text-[11px] tracking-[2px] uppercase transition-all duration-300 hover:border-[var(--obsidian-gold)] hover:text-[var(--obsidian-gold)]"
                >
                  ← Prev
                </button>
              )}
              {currentPage < totalPages && (
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="bg-transparent border border-[var(--obsidian-border)] text-[var(--obsidian-text-muted)] px-5 py-3 cursor-pointer font-[family-name:var(--font-dm-sans)] text-[11px] tracking-[2px] uppercase transition-all duration-300 hover:border-[var(--obsidian-gold)] hover:text-[var(--obsidian-gold)]"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
