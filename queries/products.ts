import { cache } from 'react'
import { prisma } from '@/lib/prisma/client'
import { redis } from '@/lib/upstash/client'
import { searchParamsCache } from '@/lib/search-params/products'
import type {
  ProductsResult,
  Category,
  ProductVariant,
} from '@/types/products'
import { Prisma } from '@/lib/generated/prisma/client'

type ProductParams = Awaited<ReturnType<typeof searchParamsCache.parse>>

const PRODUCTS_CACHE_TTL = 60 // matches ISR revalidation interval

/**
 * Get paginated and filtered products
 * Cached in Redis with TTL based on filter combination
 */
export const getProducts = cache(async (params: ProductParams): Promise<ProductsResult> => {
  // Build a deterministic cache key from the params
  const cacheKey = `products:list:${JSON.stringify(params)}`

  // Try Redis first
  const cached = await redis.get(cacheKey)
  if (cached) {
    return (typeof cached === 'string' ? JSON.parse(cached) : cached) as ProductsResult
  }

  const where: Prisma.productsWhereInput = {
    status: 'active',
    product_variants: {
      some: { inventory: { quantity_available: { gt: 0 } } },
    },
    ...(params.category?.trim() ? { categories: { slug: params.category } } : {}),
  }

  // Shared include for both query paths
  const include = {
    product_variants: {
      where: { inventory: { quantity_available: { gt: 0 } } },
      orderBy: { price: 'asc' as const },
      take: 1,
      include: { inventory: true },
    },
    product_images: {
      where: { is_primary: true },
      take: 1,
      include: { images: true },
    },
    categories: true,
  }

  const isPriceSort = params.sort === 'price-asc' || params.sort === 'price-desc'
  const offset = (params.page - 1) * params.limit

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows: any[]
  let totalCount: number

  if (isPriceSort) {
    // Prisma's orderByRelation aggregate is not enabled in this project, so use a
    // raw query to get globally sorted + paginated product IDs, then hydrate them.
    const direction = params.sort === 'price-asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`
    const categoryFilter = params.category?.trim()
      ? Prisma.sql`AND p.category_id = (SELECT id FROM categories WHERE slug = ${params.category} LIMIT 1)`
      : Prisma.empty

    const [sortedIds, count] = await Promise.all([
      prisma.$queryRaw<{ id: string }[]>`
        SELECT p.id
        FROM products p
        INNER JOIN product_variants pv ON pv.product_id = p.id
        INNER JOIN inventory i ON i.variant_id = pv.id
        WHERE p.status = 'active'
          AND i.quantity_available > 0
          ${categoryFilter}
        GROUP BY p.id
        ORDER BY MIN(pv.price) ${direction}
        LIMIT ${params.limit} OFFSET ${offset}
      `,
      prisma.products.count({ where }),
    ])

    const ids = sortedIds.map((r) => r.id)
    const unsorted = await prisma.products.findMany({ where: { id: { in: ids } }, include })
    // Re-apply raw query order — findMany does not preserve IN-list order
    const byId = new Map(unsorted.map((p) => [p.id, p]))
    rows = ids.map((id) => byId.get(id)).filter(Boolean)
    totalCount = count
  } else {
    const orderBy: Prisma.productsOrderByWithRelationInput =
      params.sort === 'popularity' ? { total_sold: 'desc' } : { created_at: 'desc' }

    const result = await prisma.$transaction([
      prisma.products.findMany({ where, orderBy, skip: offset, take: params.limit, include }),
      prisma.products.count({ where }),
    ])
    rows = result[0]
    totalCount = result[1]
  }

  // Transform to variant-centric structure and convert Decimal → number
  const data: ProductVariant[] = rows
    .filter((product) => product.product_variants.length > 0)
    .map((product) => {
      const cheapestVariant = product.product_variants[0]
      return {
        ...cheapestVariant,
        price: Number(cheapestVariant.price),
        compare_at_price: cheapestVariant.compare_at_price
          ? Number(cheapestVariant.compare_at_price)
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
 * Get all categories for filter sidebar
 * Cached in Redis for 1 hour
 */
export const getProductCategories = cache(async (): Promise<Category[]> => {
  const cacheKey = 'products:categories'
  const cached = await redis.get(cacheKey)
  if (cached) {
    return (typeof cached === 'string' ? JSON.parse(cached) : cached) as Category[]
  }

  // Fetch only top-level categories with their nested subcategories
  const data = await prisma.categories.findMany({
    where: {
      parent_id: null, // Only top-level categories
      is_visible: true,
    },
    include: {
      other_categories: {
        where: {
          is_visible: true,
        },
        include: {
          other_categories: {
            where: {
              is_visible: true,
            },
          },
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })


  await redis.setex(cacheKey, 3600, JSON.stringify(data)) // 1 hour TTL
  return data as Category[]
})

