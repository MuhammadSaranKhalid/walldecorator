import { cache } from 'react'
import { db } from '@/lib/db/client'
import { redis } from '@/lib/upstash/client'
import { eq, and, count, avg, desc } from 'drizzle-orm'
import { reviews } from '@/lib/db/schema'
import type {
  ProductDetail,
  ReviewsResult,
  Review,
  AvailableOptions,
  SelectionMap,
} from '@/types/products'

const REVIEWS_PAGE_SIZE = 10

// ─── Get Product by Slug ──────────────────────────────────────────────────────

/**
 * Get complete product details by slug for the product detail page.
 * React cache() ensures this is only called once per render even if used
 * in both generateMetadata and the page component.
 */
export const getProductBySlug = cache(async (slug: string): Promise<ProductDetail | null> => {
  const cacheKey = `product:detail:${slug}`

  const cached = await redis.get(cacheKey)
  if (cached) {
    return (typeof cached === 'string' ? JSON.parse(cached) : cached) as ProductDetail
  }

  const data = await db.query.products.findFirst({
    where: (p, { eq }) => eq(p.slug, slug),
    with: {
      categories: true,
      product_images: {
        orderBy: (pi, { asc }) => [asc(pi.display_order)],
        with: { images: true },
      },
      product_variants: {
        columns: {
          id: true,
          sku: true,
          price: true,
          compare_at_price: true,
          is_default: true,
        },
        with: {
          // Named relations for material/size/thickness attribute values
          material_attr: { columns: { value: true, display_name: true } },
          size_attr: { columns: { value: true, display_name: true } },
          thickness_attr: { columns: { value: true, display_name: true } },
          inventory: {
            columns: { quantity_available: true, allow_backorder: true },
          },
        },
      },
    },
  })

  if (!data) return null

  // ─── Data Transformation ─────────────────────────────────────────────────

  const variants = data.product_variants.map((v) => {
    return {
      id: v.id,
      sku: v.sku,
      price: Number(v.price),
      compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : null,
      stock: v.inventory?.quantity_available ?? 0,
      attributes: {
        material: v.material_attr?.value ?? '',
        material_display: v.material_attr?.display_name ?? '',
        size: v.size_attr?.value ?? '',
        size_display: v.size_attr?.display_name ?? '',
        thickness: v.thickness_attr?.value ?? '',
        thickness_display: v.thickness_attr?.display_name ?? '',
      },
    }
  })

  // Build attribute display name lookup: raw value → display name
  const attribute_display_names: Record<string, string> = {}
  variants.forEach((v) => {
    const { material, material_display, size, size_display, thickness, thickness_display } = v.attributes
    if (material) attribute_display_names[material] = material_display || material
    if (size) attribute_display_names[size] = size_display || size
    if (thickness) attribute_display_names[thickness] = thickness_display || thickness
  })

  // 1. Build hierarchical available options
  const available_options: AvailableOptions = {}
  variants.forEach((v) => {
    const { material, size, thickness } = v.attributes
    if (!available_options[material]) {
      available_options[material] = {
        display_name: attribute_display_names[material] ?? (material.charAt(0).toUpperCase() + material.slice(1)),
        sizes: {},
      }
    }
    if (!available_options[material].sizes[size]) {
      available_options[material].sizes[size] = []
    }
    if (!available_options[material].sizes[size].includes(thickness)) {
      available_options[material].sizes[size].push(thickness)
    }
  })

  // 2. Build selection map for instant client-side lookup
  const selection_map: SelectionMap = {}
  variants.forEach((v) => {
    const key = `${v.attributes.material}|${v.attributes.size}|${v.attributes.thickness}`
    selection_map[key] = {
      id: v.id,
      price: v.price,
      compare_at_price: v.compare_at_price,
      sku: v.sku,
      stock: v.stock,
    }
  })

  // 3. Calculate price range
  const prices = variants.map((v) => v.price)
  const price_range = {
    min: prices.reduce((min, p) => (p < min ? p : min), prices[0] ?? 0),
    max: prices.reduce((max, p) => (p > max ? p : max), prices[0] ?? 0),
    has_discount: variants.some((v) => v.compare_at_price !== null && v.compare_at_price > v.price),
  }

  const product: ProductDetail = {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    seo_description: data.seo_description,
    status: data.status ?? 'active',
    category: data.categories ?? null,
    product_images: data.product_images.map((img) => ({
      display_order: img.display_order ?? 0,
      is_primary: img.is_primary ?? false,
      variant_id: img.variant_id,
      image: img.images,
    })),
    available_options,
    selection_map,
    price_range,
    attribute_display_names,
  }

  await redis.setex(cacheKey, 600, JSON.stringify(product))
  return product
})

// ─── Get Top Product Slugs for Static Generation ─────────────────────────────

/**
 * Get slugs of top products for generateStaticParams.
 * Only called at build time — no caching needed.
 */
export const getTopProductSlugs = cache(async (limit: number): Promise<string[]> => {
  const data = await db.query.products.findMany({
    where: (p, { eq }) => eq(p.status, 'active'),
    columns: { slug: true },
    orderBy: (p, { desc }) => [desc(p.total_sold)],
    limit,
  })

  return data.map((p) => p.slug)
})

// ─── Get Product Reviews ──────────────────────────────────────────────────────

/**
 * Get reviews and rating summary for a product.
 * Used in the streamed ReviewSection.
 */
export const getProductReviews = cache(async (productId: string): Promise<ReviewsResult> => {
  const cacheKey = `product:${productId}:reviews`
  const cached = await redis.get(cacheKey)
  if (cached) {
    return (typeof cached === 'string' ? JSON.parse(cached) : cached) as ReviewsResult
  }

  const reviewWhere = and(eq(reviews.product_id, productId), eq(reviews.is_approved, true))

  const [reviewRows, [aggRow], distribution] = await Promise.all([
    // Page of reviews
    db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        title: reviews.title,
        body: reviews.body,
        created_at: reviews.created_at,
        reviewer_name: reviews.reviewer_name,
      })
      .from(reviews)
      .where(reviewWhere)
      .orderBy(desc(reviews.created_at))
      .limit(REVIEWS_PAGE_SIZE),

    // DB-side aggregate for count + average
    db
      .select({
        total: count(reviews.id),
        average: avg(reviews.rating),
      })
      .from(reviews)
      .where(reviewWhere),

    // Rating distribution
    db
      .select({
        rating: reviews.rating,
        cnt: count(reviews.id),
      })
      .from(reviews)
      .where(reviewWhere)
      .groupBy(reviews.rating),
  ])

  const totalCount = aggRow?.total ?? 0
  const averageRating = aggRow?.average ? Number(aggRow.average) : 0

  const distributionMap = Object.fromEntries(distribution.map((d) => [d.rating, d.cnt]))
  const distributionResult = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: distributionMap[star] ?? 0,
  }))

  const transformedReviews: Review[] = reviewRows.map((review) => ({
    id: review.id,
    rating: review.rating,
    title: review.title,
    body: review.body,
    created_at: review.created_at.toISOString(),
    profile: { display_name: review.reviewer_name },
  }))

  const result: ReviewsResult = {
    reviews: transformedReviews,
    summary: { totalCount, averageRating, distribution: distributionResult },
  }

  await redis.setex(cacheKey, 900, JSON.stringify(result))
  return result
})

// ─── Get Related Products ─────────────────────────────────────────────────────

type RelatedProduct = {
  id: string
  name: string
  slug: string
  product_images: {
    storage_path: string
    alt_text: string | null
    display_order: number
    blurhash: string | null
  }[]
  product_variants: {
    id: string
    price: number
    compare_at_price: number | null
  }[]
}

/**
 * Get related products from the same category.
 * Used in the streamed RelatedProductsSection.
 */
export const getRelatedProducts = cache(
  async (categoryId: string, excludeProductId: string): Promise<RelatedProduct[]> => {
    const cacheKey = `related:${categoryId}:${excludeProductId}`
    const cached = await redis.get(cacheKey)
    if (cached) {
      return (typeof cached === 'string' ? JSON.parse(cached) : cached) as RelatedProduct[]
    }

    // Fetch products in the same category, excluding the current product.
    // We fetch more than needed to ensure 4 in-stock products after filtering.
    const data = await db.query.products.findMany({
      where: (p, { and, eq, ne }) =>
        and(eq(p.category_id, categoryId), eq(p.status, 'active'), ne(p.id, excludeProductId)),
      columns: { id: true, name: true, slug: true },
      with: {
        product_images: {
          where: (pi, { eq }) => eq(pi.is_primary, true),
          columns: { display_order: true },
          with: {
            images: {
              columns: {
                storage_path: true,
                alt_text: true,
                blurhash: true,
                thumbnail_path: true,
                medium_path: true,
                large_path: true,
              },
            },
          },
          limit: 1,
        },
        product_variants: {
          columns: { id: true, price: true, compare_at_price: true },
          with: { inventory: { columns: { quantity_available: true } } },
        },
      },
      orderBy: (p, { desc }) => [desc(p.total_sold)],
      limit: 8,
    })

    // Filter to products that have at least one in-stock variant, then take 4
    const filtered = data
      .filter((p) => p.product_variants.some((v) => (v.inventory?.quantity_available ?? 0) > 0))
      .slice(0, 4)

    const result: RelatedProduct[] = filtered.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      product_images: product.product_images
        .filter((pi) => pi.images != null)
        .map((pi) => ({
          storage_path: pi.images!.storage_path,
          alt_text: pi.images!.alt_text,
          display_order: pi.display_order ?? 0,
          blurhash: pi.images!.blurhash,
        })),
      product_variants: product.product_variants
        .filter((v) => (v.inventory?.quantity_available ?? 0) > 0)
        .sort((a, b) => Number(a.price) - Number(b.price))
        .slice(0, 1)
        .map((v) => ({
          id: v.id,
          price: Number(v.price),
          compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : null,
        })),
    }))

    await redis.setex(cacheKey, 600, JSON.stringify(result))
    return result
  }
)
