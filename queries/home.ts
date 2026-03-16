import { cache } from 'react'
import { db } from '@/lib/db/client'
import { redis } from '@/lib/upstash/client'
import { desc, isNotNull } from 'drizzle-orm'
import { homepage_config } from '@/lib/db/schema'
import type {
  HomepageData,
  Category,
  HomepageProduct,
} from '@/types/homepage'

/**
 * Homepage configuration — hero text, promo banner, settings.
 * Cached in Redis for 30 minutes.
 */
export const getHomepageData = cache(async (): Promise<HomepageData> => {
  const cacheKey = 'homepage:data'
  const cached = await redis.get<HomepageData>(cacheKey)
  if (cached) {
    return typeof cached === 'string' ? (JSON.parse(cached) as HomepageData) : cached
  }

  const rows = await db
    .select()
    .from(homepage_config)
    .orderBy(desc(homepage_config.updated_at))
    .limit(1)

  const data = rows[0] ?? null

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

  await redis.setex(cacheKey, 1800, JSON.stringify(result))
  return result
})

/**
 * Get top-level categories for homepage showcase.
 * Cached in Redis for 1 hour.
 */
export const getCategories = cache(async (): Promise<Category[]> => {
  const cacheKey = 'homepage:categories'
  const cached = await redis.get<Category[]>(cacheKey)
  if (cached) {
    return typeof cached === 'string' ? (JSON.parse(cached) as Category[]) : cached
  }

  const data = await db.query.categories.findMany({
    where: (c, { isNull, eq, and }) => and(isNull(c.parent_id), eq(c.is_visible, true)),
    columns: {
      id: true,
      name: true,
      slug: true,
      image_id: true,
      product_count: true,
    },
    with: {
      images: {
        columns: {
          id: true,
          storage_path: true,
          alt_text: true,
          thumbnail_path: true,
          medium_path: true,
          large_path: true,
          blurhash: true,
        },
      },
    },
    orderBy: (c, { asc }) => [asc(c.display_order)],
    limit: 8,
  })

  await redis.setex(cacheKey, 3600, JSON.stringify(data))
  return data as unknown as Category[]
})

/**
 * Get featured products for homepage.
 * Cached in Redis for 30 minutes.
 */
export const getFeaturedProducts = cache(async (): Promise<HomepageProduct[]> => {
  const cacheKey = 'homepage:featured'
  const cached = await redis.get<HomepageProduct[]>(cacheKey)
  if (cached) {
    return typeof cached === 'string' ? (JSON.parse(cached) as HomepageProduct[]) : cached
  }

  const data = await db.query.products.findMany({
    where: (p, { and, eq }) =>
      and(eq(p.status, 'active'), eq(p.is_featured, true), isNotNull(p.min_price)),
    columns: {
      id: true,
      name: true,
      slug: true,
      min_price: true,
      min_compare_at_price: true,
      primary_image_medium_path: true,
      primary_image_storage_path: true,
      primary_image_blurhash: true,
      primary_image_alt_text: true,
    },
    orderBy: (p, { asc }) => [asc(p.featured_order)],
    limit: 8,
  })

  const result = normalizeProducts(data)
  await redis.setex(cacheKey, 1800, JSON.stringify(result))
  return result
})

/**
 * Get bestselling products.
 * Cached in Redis for 1 hour.
 */
export const getBestsellers = cache(async (): Promise<HomepageProduct[]> => {
  const cacheKey = 'homepage:bestsellers'
  const cached = await redis.get<HomepageProduct[]>(cacheKey)
  if (cached) {
    return typeof cached === 'string' ? (JSON.parse(cached) as HomepageProduct[]) : cached
  }

  const data = await db.query.products.findMany({
    where: (p, { eq, and }) => and(eq(p.status, 'active'), isNotNull(p.min_price)),
    columns: {
      id: true,
      name: true,
      slug: true,
      min_price: true,
      min_compare_at_price: true,
      primary_image_medium_path: true,
      primary_image_storage_path: true,
      primary_image_blurhash: true,
      primary_image_alt_text: true,
    },
    orderBy: (p, { desc }) => [desc(p.total_sold)],
    limit: 8,
  })

  const result = normalizeProducts(data)
  await redis.setex(cacheKey, 3600, JSON.stringify(result))
  return result
})

/**
 * Get newest products for homepage "New Arrivals" section.
 * Cached in Redis for 30 minutes.
 */
export const getNewArrivals = cache(async (): Promise<HomepageProduct[]> => {
  const cacheKey = 'homepage:new-arrivals'
  const cached = await redis.get<HomepageProduct[]>(cacheKey)
  if (cached) {
    return typeof cached === 'string' ? (JSON.parse(cached) as HomepageProduct[]) : cached
  }

  const data = await db.query.products.findMany({
    where: (p, { eq, and }) => and(eq(p.status, 'active'), isNotNull(p.min_price)),
    columns: {
      id: true,
      name: true,
      slug: true,
      min_price: true,
      min_compare_at_price: true,
      primary_image_medium_path: true,
      primary_image_storage_path: true,
      primary_image_blurhash: true,
      primary_image_alt_text: true,
    },
    orderBy: (p, { desc }) => [desc(p.created_at)],
    limit: 8,
  })

  const result = normalizeProducts(data)
  await redis.setex(cacheKey, 1800, JSON.stringify(result))
  return result
})

/**
 * Normalize product rows into HomepageProduct.
 * Prices come directly from DB-maintained min_price columns — no JS filtering.
 */
function normalizeProducts(
  rows: {
    id: string
    name: string
    slug: string
    min_price: string | null
    min_compare_at_price: string | null
    primary_image_medium_path: string | null
    primary_image_storage_path: string | null
    primary_image_blurhash: string | null
    primary_image_alt_text: string | null
  }[]
): HomepageProduct[] {
  return rows.map((product) => {
    const imagePath = product.primary_image_medium_path ?? product.primary_image_storage_path
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      image: imagePath
        ? {
            storage_path: imagePath,
            alt_text: product.primary_image_alt_text,
            display_order: 0,
            blurhash: product.primary_image_blurhash,
          }
        : null,
      price: product.min_price ? Number(product.min_price) : 0,
      compareAtPrice: product.min_compare_at_price
        ? Number(product.min_compare_at_price)
        : null,
    }
  })
}
