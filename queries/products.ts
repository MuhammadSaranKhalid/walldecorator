import { cache } from 'react'
import { db } from '@/lib/db/client'
import { redis } from '@/lib/upstash/client'
import { searchParamsCache } from '@/lib/search-params/products'
import { eq, and, count, isNotNull, inArray } from 'drizzle-orm'
import { products, categories } from '@/lib/db/schema'
import type {
  ProductsResult,
  Category,
  ProductListing,
} from '@/types/products'

type ProductParams = Awaited<ReturnType<typeof searchParamsCache.parse>>

// Product listings change slowly; long TTL reduces cold DB hits across pages.
const PRODUCTS_CACHE_TTL = 300 // 5 min
// Count is filter-dependent, not page-dependent — shared across all pages of the same filter.
const COUNT_CACHE_TTL = 600 // 10 min

/**
 * Get paginated and filtered products.
 *
 * Cache strategy:
 *   pageKey  — full result per page (sort + filter + page) → 5 min
 *   countKey — total count per filter (sort-independent)   → 10 min
 *
 * On page 2+: count is already cached → zero COUNT(*) queries.
 * Round-trips reduced from 2 sequential to 1 (products + count check in parallel).
 */
export const getProducts = cache(async (params: ProductParams): Promise<ProductsResult> => {
  const categorySlug = params.category?.trim() || null

  // Count key is sort-independent: same filter = same count on all pages
  const filterKey = `${categorySlug ?? 'all'}:${params.limit}`
  const pageKey   = `products:list:${params.sort}:${filterKey}:${params.page}`
  const countKey  = `products:count:${filterKey}`

  // Fastest path: full page cache hit
  const cached = await redis.get(pageKey)
  if (cached) {
    return (typeof cached === 'string' ? JSON.parse(cached) : cached) as ProductsResult
  }

  const offset = (params.page - 1) * params.limit

  // COUNT filter — used only when count cache misses
  const stockFilter = and(
    eq(products.status, 'active'),
    isNotNull(products.min_price),
    categorySlug
      ? inArray(
          products.category_id,
          db.select({ id: categories.id }).from(categories).where(eq(categories.slug, categorySlug))
        )
      : undefined
  )

  // Run products query + count cache check in parallel.
  // findMany handles sort/pagination/relations in a single logical operation —
  // no second "hydrate" round-trip needed because min_price / primary_image_*
  // are now denormalized onto products (migrations 20260316000001/2).
  const [rows, cachedCount] = await Promise.all([
    db.query.products.findMany({
      where: (p, { eq, and, isNotNull, inArray }) =>
        and(
          eq(p.status, 'active'),
          isNotNull(p.min_price),
          categorySlug
            ? inArray(
                p.category_id,
                db
                  .select({ id: categories.id })
                  .from(categories)
                  .where(eq(categories.slug, categorySlug))
              )
            : undefined
        ),
      orderBy: (p, { asc, desc }) => {
        if (params.sort === 'price-asc')  return [asc(p.min_price)]
        if (params.sort === 'price-desc') return [desc(p.min_price)]
        if (params.sort === 'popularity') return [desc(p.total_sold)]
        return [desc(p.created_at)]
      },
      limit: params.limit,
      offset,
    }),
    redis.get<number>(countKey),
  ])

  // Fetch count from DB only when not cached (first visit per filter combination)
  let totalCount: number
  if (cachedCount !== null) {
    totalCount = cachedCount
  } else {
    const [countResult] = await db
      .select({ cnt: count(products.id) })
      .from(products)
      .where(stockFilter)
    totalCount = countResult?.cnt ?? 0
    void redis.setex(countKey, COUNT_CACHE_TTL, totalCount)
  }

  // Convert numeric (string in Drizzle) price fields to number
  const data: ProductListing[] = rows.map((product) => ({
    ...product,
    price: Number(product.min_price),
    compare_at_price: product.min_compare_at_price ? Number(product.min_compare_at_price) : null,
  }))

  const result: ProductsResult = {
    items: data,
    totalCount,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(totalCount / params.limit),
  }

  await redis.setex(pageKey, PRODUCTS_CACHE_TTL, JSON.stringify(result))
  return result
})

/**
 * Get all categories for filter sidebar.
 * Cached in Redis for 1 hour.
 */
export const getProductCategories = cache(async (): Promise<Category[]> => {
  const cacheKey = 'products:categories'
  const cached = await redis.get(cacheKey)
  if (cached) {
    return (typeof cached === 'string' ? JSON.parse(cached) : cached) as Category[]
  }

  const data = await db.query.categories.findMany({
    where: (c, { isNull, eq, and }) => and(isNull(c.parent_id), eq(c.is_visible, true)),
    with: {
      other_categories: {
        where: (c, { eq }) => eq(c.is_visible, true),
        with: {
          other_categories: {
            where: (c, { eq }) => eq(c.is_visible, true),
          },
        },
      },
    },
    orderBy: (c, { asc }) => [asc(c.name)],
  })

  await redis.setex(cacheKey, 3600, JSON.stringify(data))
  return data as unknown as Category[]
})
