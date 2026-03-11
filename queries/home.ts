import { cache } from 'react'
import { prisma } from '@/lib/prisma/client'
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

  const data = await prisma.homepage_config.findFirst()

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

  const data = await prisma.categories.findMany({
    where: {
      parent_id: null, // Top-level only
      is_visible: true,
    },
    orderBy: {
      display_order: 'asc',
    },
    take: 8, // Max 8 categories on homepage
  })

  await redis.setex(cacheKey, 3600, JSON.stringify(data))
  return data as Category[]
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

  const data = await prisma.products.findMany({
    where: {
      status: 'active',
      is_featured: true,
    },
    include: {
      product_images: {
        where: { is_primary: true },
        take: 1,
      },
      product_variants: {
        orderBy: {
          price: 'asc',
        },
        take: 1,
      },
    },
    orderBy: {
      featured_order: 'asc',
    },
    take: 8,
  })

  const result = normalizeProducts(data)
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

  const data = await prisma.products.findMany({
    where: {
      status: 'active',
    },
    include: {
      product_images: {
        where: { is_primary: true },
        take: 1,
      },
      product_variants: {
        orderBy: {
          price: 'asc',
        },
        take: 1,
      },
    },
    orderBy: {
      total_sold: 'desc',
    },
    take: 8,
  })

  const result = normalizeProducts(data)
  await redis.setex(cacheKey, 3600, JSON.stringify(result)) // 1hr
  return result
})

/**
 * Normalize product data — extract primary image and cheapest variant price
 */
function normalizeProducts(data: any[]): HomepageProduct[] {
  return data.map((product) => {
    const primaryImage = product.product_images?.[0] ?? null
    const cheapestVariant = product.product_variants?.[0]

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
      price: cheapestVariant?.price ?? 0,
      compareAtPrice: cheapestVariant?.compare_at_price ?? null,
    }
  })
}
