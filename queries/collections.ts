import { cache } from 'react'
import { db } from '@/lib/db/client'
import { redis } from '@/lib/upstash/client'
import { eq, and, isNotNull } from 'drizzle-orm'

export interface Collection {
  id: string
  name: string
  slug: string
  description: string | null
  product_count: number
  image: {
    storage_path: string
    alt_text: string | null
    blurhash: string | null
    medium_path: string | null
  } | null
}

/**
 * Get all top-level categories as collections for the collections page.
 * Cached in Redis for 1 hour.
 */
export const getCollections = cache(async (): Promise<Collection[]> => {
  const cacheKey = 'collections:all'
  const cached = await redis.get(cacheKey)
  if (cached) {
    return (typeof cached === 'string' ? JSON.parse(cached) : cached) as Collection[]
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
      images: {
        columns: {
          storage_path: true,
          alt_text: true,
          blurhash: true,
          medium_path: true,
          large_path: true,
        },
      },
    },
    orderBy: (c, { asc }) => [asc(c.display_order), asc(c.name)],
  })

  const result: Collection[] = data.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    product_count: cat.product_count ?? 0,
    image: cat.images
      ? {
          storage_path: cat.images.storage_path,
          alt_text: cat.images.alt_text,
          blurhash: cat.images.blurhash,
          medium_path: cat.images.medium_path,
        }
      : null,
  }))

  await redis.setex(cacheKey, 3600, JSON.stringify(result))
  return result
})

/**
 * Get a single collection by slug with products.
 * Cached in Redis for 10 minutes.
 */
export const getCollectionBySlug = cache(async (slug: string) => {
  const cacheKey = `collection:${slug}`
  const cached = await redis.get(cacheKey)
  if (cached) {
    return typeof cached === 'string' ? JSON.parse(cached) : cached
  }

  const category = await db.query.categories.findFirst({
    where: (c, { eq, and }) => and(eq(c.slug, slug), eq(c.is_visible, true)),
    columns: {
      id: true,
      name: true,
      slug: true,
      description: true,
      product_count: true,
      seo_title: true,
      seo_description: true,
    },
    with: {
      images: {
        columns: {
          storage_path: true,
          alt_text: true,
          blurhash: true,
          medium_path: true,
        },
      },
      products: {
        where: (p, { eq, and }) => and(eq(p.status, 'active'), isNotNull(p.min_price)),
        columns: {
          id: true,
          name: true,
          slug: true,
          min_price: true,
          min_compare_at_price: true,
          primary_image_storage_path: true,
          primary_image_medium_path: true,
          primary_image_blurhash: true,
          primary_image_alt_text: true,
        },
        orderBy: (p, { desc }) => [desc(p.total_sold)],
        limit: 50,
      },
    },
  })

  if (!category) return null

  const result = {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    product_count: category.product_count ?? 0,
    seo_title: category.seo_title,
    seo_description: category.seo_description,
    image: category.images
      ? {
          storage_path: category.images.storage_path,
          alt_text: category.images.alt_text,
          blurhash: category.images.blurhash,
          medium_path: category.images.medium_path,
        }
      : null,
    products: category.products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.min_price),
      compare_at_price: p.min_compare_at_price ? Number(p.min_compare_at_price) : null,
      primary_image: {
        storage_path: p.primary_image_medium_path ?? p.primary_image_storage_path,
        alt_text: p.primary_image_alt_text,
        blurhash: p.primary_image_blurhash,
      },
    })),
  }

  await redis.setex(cacheKey, 600, JSON.stringify(result))
  return result
})
