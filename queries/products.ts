import { cache } from 'react'
import { createServerClient } from '@/lib/supabase/server'
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

  // Cache miss — query Supabase
  const supabase = await createServerClient()

  // First, get the attribute value IDs for acrylic, 2x2, and 3mm
  const { data: materialData } = await supabase
    .from('product_attribute_values')
    .select('id')
    .eq('value', 'acrylic')
    .single()

  const { data: sizeData } = await supabase
    .from('product_attribute_values')
    .select('id')
    .eq('value', '2x2')
    .single()

  const { data: thicknessData } = await supabase
    .from('product_attribute_values')
    .select('id')
    .eq('value', '3')
    .single()

  if (!materialData || !sizeData || !thicknessData) {
    throw new Error('Required attribute values not found')
  }

  // Query product_variants with the specific attribute combination
  let query = supabase
    .from('product_variants')
    .select(
      `
      id,
      price,
      compare_at_price,
      sku,
      product:products!inner(
        id,
        name,
        slug,
        created_at,
        total_sold,
        product_images(storage_path, alt_text, display_order),
        category:categories(id, name, slug)
      ),
      inventory(quantity_available)
    `,
      { count: 'exact' }
    )
    .eq('material_id', materialData.id)
    .eq('size_id', sizeData.id)
    .eq('thickness_id', thicknessData.id)
    .eq('products.status', 'active')
    .gt('inventory.quantity_available', 0)


  // Apply category filter
  if (params.category) {
    query = query.eq('products.category.slug', params.category)
  }

  // Apply price filters
  if (params.minPrice > 0) {
    query = query.gte('price', params.minPrice)
  }
  if (params.maxPrice > 0) {
    query = query.lte('price', params.maxPrice)
  }

  // Note: Color and size filters require joining with product_attribute_values
  // This is a simplified version - you may need to adjust based on your schema
  // if (params.colors.length > 0 || params.sizes.length > 0) {
  //   // Advanced filtering would go here
  // }

  // Apply sorting
  switch (params.sort) {
    case 'price-asc':
      query = query.order('price', { ascending: true })
      break
    case 'price-desc':
      query = query.order('price', { ascending: false })
      break
    case 'popularity':
      query = query.order('total_sold', {
        ascending: false,
        foreignTable: 'products'
      })
      break
    case 'newest':
    default:
      query = query.order('created_at', {
        ascending: false,
        foreignTable: 'products'
      })
      break
  }

  // Apply pagination
  const from = (params.page - 1) * params.limit
  const to = from + params.limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Failed to fetch products:', error)
    throw new Error(`Failed to fetch products: ${error.message}`)
  }

  const result: ProductsResult = {
    items: (data ?? []) as any, // Type assertion for Supabase joined data
    totalCount: count ?? 0,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil((count ?? 0) / params.limit),
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

  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id')
    .eq('is_visible', true)
    .order('name')

  if (error) {
    console.error('Failed to fetch categories:', error)
    throw new Error(`Failed to fetch categories: ${error.message}`)
  }

  const result = (data ?? []) as Category[]
  await redis.setex(cacheKey, 3600, JSON.stringify(result)) // 1 hour TTL
  return result
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

    const supabase = await createServerClient()

    // Get all unique attribute values
    // TODO: Add category filtering when schema relationships are clearer
    const { data, error } = await supabase
      .from('product_attribute_values')
      .select(
        `
        value,
        attribute:product_attributes(name)
      `
      )

    if (error) {
      console.error('Failed to fetch attributes:', error)
      // Don't throw - just return empty array for attributes
      return []
    }

    // Group by attribute name
    const grouped: Record<string, Set<string>> = {}
    data?.forEach((item: any) => {
      const attrName = item.attribute?.name
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
