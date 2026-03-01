import { Suspense } from 'react'
import { searchParamsCache } from '@/lib/search-params/products'
import { getProducts, getProductCategories, getFilterAttributes } from '@/queries/products'
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

  // Fetch all data in parallel — never sequentially
  const [products, categories, attributes] = await Promise.all([
    getProducts(parsedParams),
    getProductCategories(),
    getFilterAttributes(parsedParams.category),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* Sidebar — Client Component for interactive filters */}
        <aside className="hidden lg:block w-64 shrink-0">
          <FilterSidebar
            categories={categories}
            attributes={attributes}
            currentParams={parsedParams}
          />
        </aside>

        {/* Main content area */}
        <main className="flex-1 min-w-0">
          {/* Top bar: result count + sort */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{products.totalCount} products</p>
            {/* Client Component — updates URL on change */}
            <ProductSort currentSort={parsedParams.sort} />
          </div>

          {/* Active filter chips */}
          <ActiveFilters currentParams={parsedParams} />

          {/* Product grid wrapped in Suspense for streaming */}
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductGrid
              products={products.items}
              totalCount={products.totalCount}
              currentPage={parsedParams.page}
              limit={parsedParams.limit}
            />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
