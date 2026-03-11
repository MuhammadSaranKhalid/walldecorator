import { cache } from 'react'
import { prisma } from '@/lib/prisma/client'
import { redis } from '@/lib/upstash/client'
import { searchParamsCache } from '@/lib/search-params/products'
import type {
  ProductsResult,
  Category,
  FilterAttribute,
} from '@/types/products'

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
  const where: any = {
    status: 'active',
    product_variants: {
      some: {
        inventory: {
          quantity_available: {
            gt: 0,
          },
        },
      },
    },
  }

  // Apply category filter - filter by the slug of the related category
  if (params.category && params.category.trim() !== '') {
    where.categories = {
      slug: params.category,
    }
  }

  // Build orderBy clause
  let orderBy: any = {}
  switch (params.sort) {
    case 'price-asc':
    case 'price-desc':
      // For price sorting, we'll handle this after fetching since we need the cheapest variant
      orderBy = { created_at: 'desc' }
      break
    case 'popularity':
      orderBy = { total_sold: 'desc' }
      break
    case 'newest':
    default:
      orderBy = { created_at: 'desc' }
      break
  }

  // Execute query with pagination
  const products = await prisma.products.findMany({
    where,
    orderBy,
    skip: (params.page - 1) * params.limit,
    take: params.limit,
    include: {
      product_variants: {
        where: {
          inventory: {
            quantity_available: {
              gt: 0,
            },
          },
        },
        orderBy: {
          price: 'asc',
        },
        take: 1,
        include: {
          inventory: true,
        },
      },
      product_images: {
        where: { is_primary: true },
        take: 1,
      },
      categories: true,
    },
  })

  // Get total count - this counts all products matching category/status filters
  const totalCount = await prisma.products.count({ where })

  // Transform products to variant-centric structure and convert Decimal to number
  const data = products
    .filter((product) => product.product_variants.length > 0)
    .map((product) => {
      const cheapestVariant = product.product_variants[0]
      return {
        id: cheapestVariant.id,
        price: Number(cheapestVariant.price),
        compare_at_price: cheapestVariant.compare_at_price ? Number(cheapestVariant.compare_at_price) : null,
        sku: cheapestVariant.sku,
        products: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          product_images: product.product_images,
          categories: product.categories,
        },
        inventory: cheapestVariant.inventory,
      }
    })

  // Apply price sorting if needed
  if (params.sort === 'price-asc') {
    data.sort((a, b) => Number(a.price) - Number(b.price))
  } else if (params.sort === 'price-desc') {
    data.sort((a, b) => Number(b.price) - Number(a.price))
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

  console.log(data)

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

    // Get all unique attribute values with their attribute names
    const data = await prisma.product_attribute_values.findMany({
      include: {
        product_attributes: true,
      },
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
