import { cache } from 'react'
import { db } from '@/lib/db/client'
import { redis } from '@/lib/upstash/client'
import { searchParamsCache } from '@/lib/search-params/products'
import { eq, and, count, isNotNull, inArray, type SQL } from 'drizzle-orm'
import { products, categories } from '@/lib/db/schema'
import type {
  ProductsResult,
  Category,
  CategoryWithSubs,
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

  // Build WHERE clause for category filtering
  // When a parent category is selected, include its subcategories too
  let categoryCondition: SQL | undefined = undefined
  if (categorySlug) {
    const category = await db.query.categories.findFirst({
      where: (c, { eq }) => eq(c.slug, categorySlug),
      columns: { id: true },
      with: {
        other_categories: {
          columns: { id: true },
          where: (c, { eq }) => eq(c.is_visible, true),
        },
      },
    })
    if (category) {
      const categoryIds = [category.id, ...category.other_categories.map((c) => c.id)]
      categoryCondition =
        categoryIds.length === 1
          ? eq(products.category_id, categoryIds[0])
          : inArray(products.category_id, categoryIds)
    }
  }

  // Run products query + count cache check in parallel.
  // Explicitly select all columns including denormalized fields
  const [rows, cachedCount] = await Promise.all([
    db.query.products.findMany({
      where: (p, { eq, and, isNotNull }) =>
        and(
          eq(p.status, 'active'),
          isNotNull(p.min_price),
          categoryCondition
        ),
      columns: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        category_id: true,
        is_featured: true,
        total_sold: true,
        view_count: true,
        seo_title: true,
        seo_description: true,
        // Denormalized price fields (trigger-maintained)
        min_price: true,
        min_compare_at_price: true,
        // Denormalized image fields (trigger-maintained)
        primary_image_storage_path: true,
        primary_image_medium_path: true,
        primary_image_blurhash: true,
        primary_image_alt_text: true,
        created_at: true,
        updated_at: true,
      },
      with: {
        categories: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
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
    // Build count filter with same conditions
    const stockFilter = and(
      eq(products.status, 'active'),
      isNotNull(products.min_price),
      categoryCondition
    )

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
 * Get all top-level categories with their subcategories.
 * Only returns categories that have at least one visible product (product_count > 0)
 * OR have subcategories with products. Cached in Redis for 1 hour.
 */
export const getProductCategories = cache(async (): Promise<CategoryWithSubs[]> => {
  const cacheKey = 'products:categories:v2'
  const cached = await redis.get(cacheKey)
  if (cached) {
    return (typeof cached === 'string' ? JSON.parse(cached) : cached) as CategoryWithSubs[]
  }

  const data = await db.query.categories.findMany({
    where: (c, { isNull, eq, and }) => and(isNull(c.parent_id), eq(c.is_visible, true)),
    columns: {
      id: true,
      name: true,
      slug: true,
      description: true,
      product_count: true,
    },
    with: {
      other_categories: {
        where: (c, { eq }) => eq(c.is_visible, true),
        columns: { id: true, name: true, slug: true, product_count: true },
      },
    },
    orderBy: (c, { asc }) => [asc(c.display_order), asc(c.name)],
  })

  // Include a category if it has products itself OR any subcategory has products
  const result: CategoryWithSubs[] = data
    .filter((cat) => {
      const hasOwnProducts = (cat.product_count ?? 0) > 0
      const hasSubProducts = cat.other_categories.some((sub) => (sub.product_count ?? 0) > 0)
      return hasOwnProducts || hasSubProducts
    })
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      product_count: cat.product_count ?? 0,
      subcategories: cat.other_categories
        .filter((sub) => (sub.product_count ?? 0) > 0)
        .map((sub) => ({
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          product_count: sub.product_count ?? 0,
        })),
    }))

  await redis.setex(cacheKey, 3600, JSON.stringify(result))
  return result
})
