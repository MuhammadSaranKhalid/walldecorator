import { cache } from 'react'
import { db } from '@/lib/db/client'
import { redis } from '@/lib/upstash/client'
import { searchParamsCache } from '@/lib/search-params/products'
import { eq, and, count, asc, desc, isNotNull, inArray } from 'drizzle-orm'
import { products, categories } from '@/lib/db/schema'
import type {
  ProductsResult,
  Category,
  ProductVariant,
} from '@/types/products'

type ProductParams = Awaited<ReturnType<typeof searchParamsCache.parse>>

const PRODUCTS_CACHE_TTL = 60 // matches ISR revalidation interval

/**
 * Get paginated and filtered products.
 * Cached in Redis with TTL based on filter combination.
 */
export const getProducts = cache(async (params: ProductParams): Promise<ProductsResult> => {
  const cacheKey = `products:list:${JSON.stringify(params)}`

  const cached = await redis.get(cacheKey)
  if (cached) {
    return (typeof cached === 'string' ? JSON.parse(cached) : cached) as ProductsResult
  }

  const offset = (params.page - 1) * params.limit
  const categorySlug = params.category?.trim() || null

  // min_price IS NOT NULL means the product has at least one in-stock variant.
  // The value is maintained by DB triggers (see migration 20260316000001).
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

  // ORDER BY: price columns live on the product itself — no variant join needed
  const orderByExpr =
    params.sort === 'price-asc'
      ? asc(products.min_price)
      : params.sort === 'price-desc'
        ? desc(products.min_price)
        : params.sort === 'popularity'
          ? desc(products.total_sold)
          : desc(products.created_at)

  // Step 1: Sorted + paginated IDs and total count — simple single-table queries
  const [sortedResult, countResult] = await Promise.all([
    db
      .select({ id: products.id })
      .from(products)
      .where(stockFilter)
      .orderBy(orderByExpr)
      .limit(params.limit)
      .offset(offset),
    db
      .select({ cnt: count(products.id) })
      .from(products)
      .where(stockFilter),
  ])

  const ids = sortedResult.map((r) => r.id)
  const totalCount = countResult[0]?.cnt ?? 0

  // Step 2: Hydrate with full relations, re-applying the sort order from Step 1
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows: any[] = []

  if (ids.length > 0) {
    const unsorted = await db.query.products.findMany({
      where: (p, { inArray }) => inArray(p.id, ids),
      with: {
        product_variants: {
          with: { inventory: true },
          orderBy: (pv, { asc }) => [asc(pv.price)],
          limit: 1,
        },
        categories: true,
      },
    })

    const byId = new Map(unsorted.map((p) => [p.id, p]))
    rows = ids.map((id) => byId.get(id)).filter(Boolean)
  }

  // Transform to variant-centric structure and convert numeric → number
  const data: ProductVariant[] = rows
    .filter((product) => product.product_variants.length > 0)
    .map((product) => {
      const cheapestVariant = product.product_variants[0]
      return {
        ...cheapestVariant,
        price: Number(product.min_price ?? cheapestVariant.price),
        compare_at_price: product.min_compare_at_price
          ? Number(product.min_compare_at_price)
          : null,
        products: { ...product, product_variants: undefined },
        inventory: cheapestVariant.inventory,
      } as ProductVariant
    })

  const result: ProductsResult = {
    items: data,
    totalCount,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(totalCount / params.limit),
  }

  await redis.setex(cacheKey, PRODUCTS_CACHE_TTL, JSON.stringify(result))
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
