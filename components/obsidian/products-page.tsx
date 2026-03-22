'use client'

import { useState, useMemo } from 'react'
import { ObsidianProductCard } from './product-card'
import { CategoryBar, SubcategoryBar, ResultsBar } from './category-bar'

interface ProductsPageProps {
  initialProducts: any[]
  categories?: any[]
}

const PAGE_SIZE = 12

// Category taxonomy - should eventually come from backend
const categoryTaxonomy: Record<string, { label: string; subs: string[] }> = {
  All: { label: 'All Pieces', subs: [] },
  Anime: {
    label: 'Anime',
    subs: [
      'All Anime',
      'Dragon Ball',
      'Naruto',
      'One Piece',
      'Attack on Titan',
      'Demon Slayer',
      'My Hero Academia',
    ],
  },
  Movies: {
    label: 'Movies & TV',
    subs: ['All Movies & TV', 'Marvel', 'DC Comics', 'Star Wars', 'Disney', 'Harry Potter'],
  },
  Gaming: {
    label: 'Gaming',
    subs: ['All Gaming', 'PlayStation', 'Xbox / PC', 'Nintendo', 'Retro'],
  },
  Nature: {
    label: 'Nature',
    subs: ['All Nature', 'Wildlife', 'Landscapes', 'Botanical', 'Ocean & Marine'],
  },
  Sports: {
    label: 'Sports',
    subs: ['All Sports', 'Football / Soccer', 'Basketball', 'Combat Sports', 'Motor Racing'],
  },
  Abstract: {
    label: 'Abstract',
    subs: ['All Abstract', 'Geometric', 'Mandala', 'Japanese Art', 'Typography'],
  },
  Life: {
    label: 'Life & Family',
    subs: ['All Life', 'Romance', 'Family', 'Motivational', 'Pets'],
  },
}

export function ObsidianProductsPage({ initialProducts, categories }: ProductsPageProps) {
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeSubcategory, setActiveSubcategory] = useState('')
  const [sortMode, setSortMode] = useState('default')
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Extract category names from taxonomy
  const categoryNames = Object.keys(categoryTaxonomy)

  // Get subcategories for active category
  const subcategories = categoryTaxonomy[activeCategory]?.subs || []

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let products = initialProducts.filter((product) => {
      // Category filter
      const categoryMatch =
        activeCategory === 'All' ||
        product.category?.name === activeCategory ||
        product.cat === activeCategory

      // Subcategory filter
      const subcategoryMatch =
        !activeSubcategory ||
        activeSubcategory.startsWith('All ') ||
        product.subcategory === activeSubcategory ||
        product.subcat === activeSubcategory

      // Search filter
      const searchMatch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.name.toLowerCase().includes(searchQuery.toLowerCase())

      return categoryMatch && subcategoryMatch && searchMatch
    })

    // Sort
    if (sortMode === 'price-asc') {
      products = [...products].sort((a, b) => a.price - b.price)
    } else if (sortMode === 'price-desc') {
      products = [...products].sort((a, b) => b.price - a.price)
    } else if (sortMode === 'name') {
      products = [...products].sort((a, b) => a.name.localeCompare(b.name))
    }

    return products
  }, [initialProducts, activeCategory, activeSubcategory, sortMode, searchQuery])

  const totalResults = filteredProducts.length
  const visibleProducts = filteredProducts.slice(0, visibleCount)
  const hasMore = visibleCount < totalResults

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
    setActiveSubcategory('')
    setVisibleCount(PAGE_SIZE)
  }

  const handleSubcategoryChange = (subcategory: string) => {
    setActiveSubcategory(subcategory.startsWith('All ') ? '' : subcategory)
    setVisibleCount(PAGE_SIZE)
  }

  const loadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE)
  }

  const categoryLabel =
    activeCategory === 'All' ? 'All Pieces' : categoryTaxonomy[activeCategory]?.label || activeCategory

  return (
    <div className="relative z-[1]">
      {/* Categories Bar */}
      <CategoryBar
        categories={categoryNames.map((name) => ({
          id: name,
          name: categoryTaxonomy[name].label,
          slug: name,
        }))}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />

      {/* Subcategories Bar */}
      {subcategories.length > 0 && (
        <SubcategoryBar
          subcategories={subcategories.map((name, index) => ({
            id: `${activeCategory}-${index}`,
            name,
            slug: name,
          }))}
          activeSubcategory={activeSubcategory}
          onSubcategoryChange={handleSubcategoryChange}
          visible={true}
        />
      )}

      {/* Results Bar */}
      <ResultsBar
        totalResults={totalResults}
        currentCategory={activeCategory !== 'All' ? categoryLabel : undefined}
        currentSubcategory={activeSubcategory}
      />

      {/* Products Section */}
      <section className="px-6 sm:px-12 py-15">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-10">
          <div className="font-[family-name:var(--font-cormorant)] text-[42px] font-light leading-tight">
            Wall Art{' '}
            {totalResults > 0 && (
              <span className="text-[var(--obsidian-text-muted)] italic font-[family-name:var(--font-cormorant)] text-[28px] font-light">
                ({totalResults})
              </span>
            )}
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
            className="bg-[var(--obsidian-surface)] border border-[var(--obsidian-border)] text-[var(--obsidian-text-muted)] px-3.5 py-2 font-[family-name:var(--font-dm-sans)] text-[11px] cursor-pointer outline-none"
          >
            <option value="default">Featured</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>

        {/* Products Grid */}
        {totalResults === 0 ? (
          <div className="text-center py-20 text-[var(--obsidian-text-muted)] text-xs tracking-[2px] uppercase">
            No pieces found
          </div>
        ) : (
          <div className="grid gap-[2px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {visibleProducts.map((product, index) => (
              <ObsidianProductCard
                key={product.id}
                product={product}
                animationDelay={index * 50}
              />
            ))}
          </div>
        )}

        {/* Pagination/Load More */}
        {hasMore && (
          <div className="flex flex-col items-center pt-12 gap-4">
            {/* Progress Bar */}
            <div className="w-[200px] h-px bg-[var(--obsidian-border)] relative overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-[var(--obsidian-gold)] transition-[width] duration-400"
                style={{ width: `${(visibleCount / totalResults) * 100}%` }}
              />
            </div>

            {/* Progress Text */}
            <div className="text-[10px] text-[var(--obsidian-text-dim)] tracking-[1px] text-center">
              Showing {visibleCount} of {totalResults}
            </div>

            {/* Load More Button */}
            <button
              onClick={loadMore}
              className="bg-transparent border border-[var(--obsidian-border)] text-[var(--obsidian-text-muted)] px-12 py-4 cursor-pointer font-[family-name:var(--font-dm-sans)] text-[11px] tracking-[3px] uppercase transition-all duration-300 relative overflow-hidden hover:border-[var(--obsidian-gold)] hover:text-[var(--obsidian-gold)]"
            >
              Load More Pieces
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
