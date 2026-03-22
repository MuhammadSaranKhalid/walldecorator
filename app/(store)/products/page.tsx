import { Suspense, use } from 'react'
import type { SearchParams } from 'nuqs/server'
import { searchParamsCache } from '@/lib/search-params/products'
import { getProducts, getProductCategories } from '@/queries/products'
import { ObsidianProductsPage } from '@/components/obsidian/products-page'

// Enable ISR: cache products page per unique URL, revalidate every 60s
export const revalidate = 60

// SEO metadata
export const metadata = {
  title: 'Shop Wall Art | OBSIDIAN',
  description:
    'Shop our curated collection of premium laser-cut wall art. Explore anime, movies, gaming, nature and more. Free shipping over Rs. 5,000.',
  openGraph: {
    title: 'Shop Wall Art | OBSIDIAN',
    description:
      'Shop our curated collection of premium laser-cut wall art. Explore anime, movies, gaming, nature and more.',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'OBSIDIAN — Wall Art Collection' }],
  },
}

type ProductsPageProps = {
  searchParams: Promise<SearchParams>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  // Parse and validate all URL params in one call (awaits the promise in Next.js 15+)
  const parsedParams = await searchParamsCache.parse(searchParams)

  // Fetch products and categories
  const productsPromise = getProducts(parsedParams)
  const categoriesPromise = getProductCategories()

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ProductsSection productsPromise={productsPromise} categoriesPromise={categoriesPromise} />
    </Suspense>
  )
}

// ─── Server Component for Streaming ─────────────

function ProductsSection({
  productsPromise,
  categoriesPromise,
}: {
  productsPromise: ReturnType<typeof getProducts>
  categoriesPromise: ReturnType<typeof getProductCategories>
}) {
  const products = use(productsPromise)
  const categories = use(categoriesPromise)

  return <ObsidianProductsPage initialProducts={products.items} categories={categories} />
}
