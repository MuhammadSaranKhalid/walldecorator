import { cache } from 'react'
import { prisma } from '@/lib/prisma/client'
import { redis } from '@/lib/upstash/client'
import { searchParamsCache } from '@/lib/search-params/products'
import type {
  ProductsResult,
  Category,
  FilterAttribute,
  ProductVariant,
} from '@/types/products'
import type { Prisma } from '@/lib/generated/prisma/client'

type ProductParams = Awaited<ReturnType<typeof searchParamsCache.parse>>

const PRODUCTS_CACHE_TTL = 300 // 5 minutes

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

  // Build where clause for products
  const where: Prisma.productsWhereInput = {
    status: 'active',
    product_variants: {
      some: {
        inventory: {
          quantity_available: { gt: 0 },
        },
      },
    },
    // Apply category filter by slug of related category
    ...(params.category?.trim()
      ? { categories: { slug: params.category } }
      : {}),
  }

  // Build orderBy clause
  // Price sort: push it into the variant sub-query orderBy so the cheapest
  // variant is selected in the right order; product-level sort falls back to
  // created_at here and the variant price drives the final order.
  const isPriceSort = params.sort === 'price-asc' || params.sort === 'price-desc'
  const orderBy: Prisma.productsOrderByWithRelationInput =
    params.sort === 'popularity'
      ? { total_sold: 'desc' }
      : { created_at: 'desc' }

  // Execute findMany + count atomically in a single round-trip
  const [products, totalCount] = await prisma.$transaction([
    prisma.products.findMany({
      where,
      orderBy,
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      include: {
        product_variants: {
          where: {
            inventory: { quantity_available: { gt: 0 } },
          },
          orderBy: { price: 'asc' },
          take: 1,
          include: { inventory: true },
        },
        product_images: {
          where: { is_primary: true },
          take: 1,
          include: {
            images: true,  // Join with centralized images table
          },
        },
        categories: true,
      },
    }),
    prisma.products.count({ where }),
  ])

  // Transform products to variant-centric structure and convert Decimal to number
  const data = products
    .filter((product) => product.product_variants.length > 0)
    .map((product) => {
      const cheapestVariant = product.product_variants[0]
      return {
        ...cheapestVariant,
        price: Number(cheapestVariant.price),
        compare_at_price: cheapestVariant.compare_at_price ? Number(cheapestVariant.compare_at_price) : null,
        products: {
          ...product,
          product_variants: undefined
        },
        inventory: cheapestVariant.inventory,
      } as ProductVariant
    })

  // Apply price sorting in JS (variants are already ordered by price asc from DB)
  if (isPriceSort) {
    data.sort((a, b) =>
      params.sort === 'price-asc'
        ? Number(a.price) - Number(b.price)
        : Number(b.price) - Number(a.price)
    )
  }

  const result: ProductsResult = {
    items: data as any,
    totalCount, // Approximate count (doesn't account for price filters)
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(totalCount / params.limit),
  }

  // Write to Redis
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

/**
 * Get available filter attributes (colors, sizes) for a category
 * Cached in Redis for 10 minutes
 *
 * Note: Currently returns all attributes. Category-specific filtering
 * can be added later with proper joins through product_variants.
 */
export const getFilterAttributes = cache(
  async (categorySlug: string): Promise<FilterAttribute[]> => {
    const cacheKey = `products:attributes:${categorySlug || 'all'}`
    const cached = await redis.get(cacheKey)
    if (cached) {
      return (typeof cached === 'string' ? JSON.parse(cached) : cached) as FilterAttribute[]
    }

    // Get all unique attribute values — use select (not include) to avoid
    // fetching the entire joined relation when we only need two fields.
    const data = await prisma.product_attribute_values.findMany({
      select: {
        value: true,
        product_attributes: {
          select: { name: true },
        },
      },
      orderBy: { display_order: 'asc' },
    })

    // Group by attribute name
    const grouped: Record<string, Set<string>> = {}
    data.forEach((item) => {
      const attrName = item.product_attributes?.name
      if (attrName) {
        if (!grouped[attrName]) {
          grouped[attrName] = new Set()
        }
        grouped[attrName].add(item.value)
      }
    })

    const result: FilterAttribute[] = Object.entries(grouped).map(([name, values]) => ({
      name,
      values: Array.from(values).sort(),
    }))

    await redis.setex(cacheKey, 600, JSON.stringify(result)) // 10 minutes
    return result
  }
)
