import { cache } from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { supabase } from '@/lib/supabase/client'
import { redis } from '@/lib/upstash/client'
import type { ProductDetail, ReviewsResult } from '@/types/products'

// ─── Get Product by Slug ──────────────────────────────────────────────────────

/**
 * Get complete product details by slug for the product detail page
 * React cache() ensures this is only called once per render even if used
 * in both generateMetadata and the page component
 */
export const getProductBySlug = cache(async (slug: string): Promise<ProductDetail | null> => {
  const cacheKey = `product:detail:${slug}`

  // Try Redis first
  const cached = await redis.get(cacheKey)
  if (cached) {
    return (typeof cached === 'string' ? JSON.parse(cached) : cached) as ProductDetail
  }

  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      slug,
      description,
      seo_description,
      status,
      category:categories(id, name, slug),
      product_images(
        id,
        storage_path,
        alt_text,
        display_order,
        variant_id
      ),
      product_variants(
        id,
        sku,
        price,
        compare_at_price,
        material:product_attribute_values!product_variants_material_id_fkey(
          value,
          attribute:product_attributes(name)
        ),
        size:product_attribute_values!product_variants_size_id_fkey(
          value,
          attribute:product_attributes(name)
        ),
        thickness:product_attribute_values!product_variants_thickness_id_fkey(
          value,
          attribute:product_attributes(name)
        ),
        inventory(quantity_available)
      )
    `)
    .eq('slug', slug)
    .single()

  // Debug logging
  if (error) {
    console.error('Error fetching product by slug:', slug, error)
    return null
  }

  if (!data) {
    console.warn('No product found for slug:', slug)
    return null
  }

  // Transform the data: combine material, size, thickness into product_attribute_values array
  const transformedData = {
    ...data,
    product_variants: data.product_variants.map((variant: any) => {
      const product_attribute_values = []

      // Add material
      if (variant.material) {
        product_attribute_values.push(variant.material)
      }

      // Add size
      if (variant.size) {
        product_attribute_values.push(variant.size)
      }

      // Add thickness
      if (variant.thickness) {
        product_attribute_values.push(variant.thickness)
      }

      // Remove individual fields and return variant with combined array
      const { material, size, thickness, ...rest } = variant
      return {
        ...rest,
        product_attribute_values,
      }
    }),
  }

  const product = transformedData as unknown as ProductDetail

  // Cache for 10 minutes
  await redis.setex(cacheKey, 600, JSON.stringify(product))

  return product
})

// ─── Get Top Product Slugs for Static Generation ─────────────────────────────

/**
 * Get slugs of top products for generateStaticParams
 * Only called at build time - no caching needed
 * Uses the client-side Supabase client (no cookies needed at build time)
 */
export async function getTopProductSlugs(limit: number): Promise<string[]> {
  const { data } = await supabase
    .from('products')
    .select('slug')
    .eq('status', 'active')
    .order('total_sold', { ascending: false })
    .limit(limit)

  return data?.map((p) => p.slug) ?? []
}

// ─── Get Product Reviews ──────────────────────────────────────────────────────

/**
 * Get reviews and rating summary for a product
 * Used in the streamed ReviewSection
 */
export const getProductReviews = cache(async (productId: string): Promise<ReviewsResult> => {
  const cacheKey = `product:${productId}:reviews`
  const cached = await redis.get(cacheKey)
  if (cached) {
    return (typeof cached === 'string' ? JSON.parse(cached) : cached) as ReviewsResult
  }

  const supabase = await createServerClient()

  // Fetch both reviews and all ratings in parallel
  const [reviewsResult, ratingsResult] = await Promise.all([
    supabase
      .from('reviews')
      .select(`
        id,
        rating,
        title,
        body,
        created_at,
        profile:profiles(display_name)
      `)
      .eq('product_id', productId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(10),

    supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId)
      .eq('is_approved', true),
  ])

  const reviews = reviewsResult.data ?? []
  const allRatings = ratingsResult.data ?? []

  // Calculate summary
  const totalCount = allRatings.length
  const averageRating =
    totalCount > 0
      ? allRatings.reduce((sum, r) => sum + r.rating, 0) / totalCount
      : 0

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: allRatings.filter((r) => r.rating === star).length,
  }))

  const result: ReviewsResult = {
    reviews: reviews as any,
    summary: {
      totalCount,
      averageRating,
      distribution,
    },
  }

  // Cache for 15 minutes
  await redis.setex(cacheKey, 900, JSON.stringify(result))

  return result
})

// ─── Get Related Products ─────────────────────────────────────────────────────

/**
 * Get related products from the same category
 * Used in the streamed RelatedProductsSection
 */
export const getRelatedProducts = cache(
  async (categoryId: string, excludeProductId: string) => {
    const cacheKey = `related:${categoryId}:${excludeProductId}`
    const cached = await redis.get(cacheKey)
    if (cached) {
      return typeof cached === 'string' ? JSON.parse(cached) : cached
    }

    const supabase = await createServerClient()

    console.log('Fetching related products for category:', categoryId, 'excluding:', excludeProductId)

    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        product_images(storage_path, alt_text, display_order),
        product_variants(price, compare_at_price)
      `)
      .eq('category_id', categoryId)
      .eq('status', 'active')
      .neq('id', excludeProductId)
      .order('total_sold', { ascending: false })
      .limit(4)

    if (error) {
      console.error('Error fetching related products:', error)
    }

    console.log('Related products found:', data?.length ?? 0)

    const result = data ?? []
    await redis.setex(cacheKey, 600, JSON.stringify(result))
    return result
  }
)
