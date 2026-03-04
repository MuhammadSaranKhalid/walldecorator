import { Suspense } from 'react'
import { searchParamsCache } from '@/lib/search-params/products'
import { getProducts, getProductCategories } from '@/queries/products'
import { ProductGrid } from '@/components/store/products/product-grid'
import { FilterSidebar } from '@/components/store/products/filter-sidebar'
import { ProductSort } from '@/components/store/products/product-sort'
import { ActiveFilters } from '@/components/store/products/active-filters'
import { ProductGridSkeleton } from '@/components/store/products/product-grid-skeleton'

// Force dynamic rendering — every request reads fresh URL params
export const dynamic = 'force-dynamic'

// SEO metadata
export const metadata = {
  title: 'Products | Wall Decorator',
  description: 'Browse our full collection of premium metal wall art products.',
}

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  // Parse and validate all URL params in one call
  const awaitedParams = await searchParams
  const parsedParams = searchParamsCache.parse(awaitedParams)

  // Start data fetches immediately, but don't await them here
  const productsPromise = getProducts(parsedParams)
  const categoriesPromise = getProductCategories()

  return (
    <div className="container mx-auto px-4 py-8">
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
              parsedParams={parsedParams}
            />
          </Suspense>
        </main>
      </div>
    </div>
  )
}

// ─── Async Server Components for Streaming ───────────────────────────────────

async function FilterSidebarSection({
  categoriesPromise,
}: {
  categoriesPromise: ReturnType<typeof getProductCategories>
}) {
  const categories = await categoriesPromise

  return <FilterSidebar categories={categories} />
}

async function ProductResultsSection({
  productsPromise,
  parsedParams,
}: {
  productsPromise: ReturnType<typeof getProducts>
  parsedParams: Awaited<ReturnType<typeof searchParamsCache.parse>>
}) {
  const products = await productsPromise

  return (
    <>
      <div className="flex items-center justify-between mb-4 mt-4 lg:mt-0">
        <p className="text-sm text-muted-foreground">{products.totalCount} products</p>
        <ProductSort currentSort={parsedParams.sort} />
      </div>

      <ProductGrid
        products={products.items}
        totalCount={products.totalCount}
        currentPage={parsedParams.page}
        limit={parsedParams.limit}
      />
    </>
  )
}
