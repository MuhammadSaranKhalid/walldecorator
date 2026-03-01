import { cache } from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { redis } from '@/lib/upstash/client'
import type {
  HomepageData,
  Category,
  HomepageProduct,
} from '@/types/homepage'

/**
 * Homepage configuration — hero text, promo banner, settings
 * Cached in Redis for 30 minutes
 */
export const getHomepageData = cache(async (): Promise<HomepageData> => {
  const cacheKey = 'homepage:data'
  const cached = await redis.get<HomepageData>(cacheKey)
  if (cached) {
    return typeof cached === 'string' ? JSON.parse(cached) as HomepageData : cached
  }

  const supabase = await createServerClient()

  const { data } = await supabase
    .from('homepage_config')
    .select('*')
    .single()

  const result: HomepageData = {
    hero: {
      headline: data?.hero_headline ?? 'Shop the Latest Collection',
      subheadline: data?.hero_subheadline ?? 'Free shipping on orders over Rs. 5,000',
      ctaText: data?.hero_cta_text ?? 'Shop Now',
      ctaLink: data?.hero_cta_link ?? '/products',
      imagePath: data?.hero_image_path ?? null,
    },
    promo: {
      isActive: data?.promo_is_active ?? false,
      headline: data?.promo_headline ?? '',
      subheadline: data?.promo_subheadline ?? '',
      ctaText: data?.promo_cta_text ?? '',
      ctaLink: data?.promo_cta_link ?? '',
      backgroundColor: data?.promo_bg_color ?? '#000000',
    },
  }

  // 30 min TTL — matches page revalidate window
  await redis.setex(cacheKey, 1800, JSON.stringify(result))
  return result
})

/**
 * Get top-level categories for homepage showcase
 * Cached in Redis for 1 hour
 */
export const getCategories = cache(async (): Promise<Category[]> => {
  const cacheKey = 'homepage:categories'
  const cached = await redis.get<Category[]>(cacheKey)
  if (cached) {
    return typeof cached === 'string' ? JSON.parse(cached) as Category[] : cached
  }

  const supabase = await createServerClient()

  const { data } = await supabase
    .from('categories')
    .select('id, name, slug, image_path, product_count')
    .is('parent_id', null) // Top-level only
    .eq('is_visible', true)
    .order('display_order')
    .limit(8) // Max 8 categories on homepage

  const result = data ?? []
  await redis.setex(cacheKey, 3600, JSON.stringify(result))
  return result
})

/**
 * Get featured products for homepage
 * Cached in Redis for 30 minutes
 */
export const getFeaturedProducts = cache(async (): Promise<HomepageProduct[]> => {
  const cacheKey = 'homepage:featured'
  const cached = await redis.get<HomepageProduct[]>(cacheKey)
  if (cached) {
    return typeof cached === 'string' ? JSON.parse(cached) as HomepageProduct[] : cached
  }

  const supabase = await createServerClient()

  const { data } = await supabase
    .from('products')
    .select(
      `
      id, name, slug,
      product_images(storage_path, alt_text, display_order, blurhash),
      product_variants(price, compare_at_price)
    `
    )
    .eq('status', 'active')
    .eq('is_featured', true)
    .order('featured_order')
    .limit(8)

  const result = normalizeProducts(data ?? [])
  await redis.setex(cacheKey, 1800, JSON.stringify(result))
  return result
})

/**
 * Get bestselling products
 * Cached in Redis for 1 hour (changes slowly)
 */
export const getBestsellers = cache(async (): Promise<HomepageProduct[]> => {
  const cacheKey = 'homepage:bestsellers'
  const cached = await redis.get<HomepageProduct[]>(cacheKey)
  if (cached) {
    return typeof cached === 'string' ? JSON.parse(cached) as HomepageProduct[] : cached
  }

  const supabase = await createServerClient()

  const { data } = await supabase
    .from('products')
    .select(
      `
      id, name, slug,
      product_images(storage_path, alt_text, display_order, blurhash),
      product_variants(price, compare_at_price)
    `
    )
    .eq('status', 'active')
    .order('total_sold', { ascending: false })
    .limit(8)


  const result = normalizeProducts(data ?? [])
  await redis.setex(cacheKey, 3600, JSON.stringify(result)) // 1hr
  return result
})

/**
 * Normalize product data — pick primary image, lowest variant price
 */
function normalizeProducts(data: any[]): HomepageProduct[] {
  return data.map((product) => {
    const primaryImage = product.product_images
      ?.sort((a: any, b: any) => a.display_order - b.display_order)[0] ?? null

    const prices = product.product_variants?.map((v: any) => v.price) ?? []
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0

    const comparePrices =
      product.product_variants
        ?.map((v: any) => v.compare_at_price)
        .filter(Boolean) ?? []
    const maxComparePrice =
      comparePrices.length > 0 ? Math.max(...comparePrices) : null

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      image: primaryImage
        ? {
          storage_path: primaryImage.storage_path,
          alt_text: primaryImage.alt_text,
          display_order: primaryImage.display_order,
          blurhash: primaryImage.blurhash,
        }
        : null,
      price: minPrice,
      compareAtPrice: maxComparePrice,
    }
  })
}
