import { Suspense, use } from 'react'
import type { SearchParams } from 'nuqs/server'
import { searchParamsCache } from '@/lib/search-params/products'
import { getProducts, getProductCategories } from '@/queries/products'
import { ProductGrid } from '@/components/store/products/product-grid'
import { FilterSidebar } from '@/components/store/products/filter-sidebar'
import { ProductSort } from '@/components/store/products/product-sort'
import { ActiveFilters } from '@/components/store/products/active-filters'
import { ProductGridSkeleton } from '@/components/store/products/product-grid-skeleton'
import { ProductFiltersProvider } from '@/components/store/products/product-filters-provider'

// Enable ISR: cache products page per unique URL, revalidate every 60s
export const revalidate = 60

// SEO metadata
export const metadata = {
  title: 'Shop Metal Wall Art | Wall Decorator',
  description:
    'Shop our curated collection of premium laser-cut metal wall art. Explore anime, vehicles, custom designs and more. Free shipping over Rs. 5,000.',
  openGraph: {
    title: 'Shop Metal Wall Art | Wall Decorator',
    description:
      'Shop our curated collection of premium laser-cut metal wall art. Explore anime, vehicles, custom designs and more. Free shipping over Rs. 5,000.',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Wall Decorator — Metal Wall Art Collection' }],
  },
}


type ProductsPageProps = {
  searchParams: Promise<SearchParams>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  // Parse and validate all URL params in one call (awaits the promise in Next.js 15+)
  const parsedParams = await searchParamsCache.parse(searchParams)

  // Start data fetches immediately, but don't await them here
  const productsPromise = getProducts(parsedParams)
  const categoriesPromise = getProductCategories()

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page H1 — hidden visually on desktop (sidebar+grid layout), but visible to crawlers */}
      <h1 className="sr-only">Shop Wall Art</h1>
      <ProductFiltersProvider>
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <Suspense fallback={<div className="h-96 bg-muted animate-pulse rounded-md" />}>
              <FilterSidebarSection
                categoriesPromise={categoriesPromise}
              />
            </Suspense>
          </aside>

          {/* Main content area */}
          <main className="flex-1 min-w-0">
            {/* Active filter chips */}
            <ActiveFilters />

            {/* Stream the products, results count, sorting, and grid */}
            <Suspense fallback={<div className="mt-8"><ProductGridSkeleton /></div>}>
              <ProductResultsSection
                productsPromise={productsPromise}
              />
            </Suspense>
          </main>
        </div>
      </ProductFiltersProvider>
    </div>
  )
}

// ─── Server Components for Streaming (React 19 with use() hook) ─────────────

function FilterSidebarSection({
  categoriesPromise,
}: {
  categoriesPromise: ReturnType<typeof getProductCategories>
}) {
  // React 19: use() hook unwraps promises - cleaner than async/await
  const categories = use(categoriesPromise)

  return <FilterSidebar categories={categories} />
}

function ProductResultsSection({
  productsPromise,
}: {
  productsPromise: ReturnType<typeof getProducts>
}) {
  // React 19: use() hook unwraps promises - can be called conditionally
  const products = use(productsPromise)

  return (
    <>
      <div className="flex items-center justify-between mb-4 mt-4 lg:mt-0">
        <p className="text-sm text-muted-foreground">{products.totalCount} products</p>
        <ProductSort />
      </div>

      <ProductGrid
        initialProducts={products.items}
        totalPages={products.totalPages}
        currentPage={products.page}
      />
    </>
  )
}
