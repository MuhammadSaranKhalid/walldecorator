import { cache } from 'react'
import { prisma } from '@/lib/prisma/client'
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

  try {
    const data = await prisma.products.findUnique({
      where: { slug },
      include: {
        categories: true,
        product_images: {
          orderBy: { display_order: 'asc' },
        },
        product_variants: {
          select: {
            id: true,
            sku: true,
            price: true,
            compare_at_price: true,
            is_default: true,
            // Only fetch .value — product_attributes name is not used in transform
            product_attribute_values_product_variants_material_idToproduct_attribute_values: {
              select: { value: true },
            },
            product_attribute_values_product_variants_size_idToproduct_attribute_values: {
              select: { value: true },
            },
            product_attribute_values_product_variants_thickness_idToproduct_attribute_values: {
              select: { value: true },
            },
            inventory: {
              select: {
                quantity_available: true,
                allow_backorder: true,
              },
            },
          },
        },
      },
    })

    if (!data) {
      console.warn('No product found for slug:', slug)
      return null
    }

    // ─── Data Transformation ──────────────────────────────────────────────────

    const variants = data.product_variants.map((v) => {
      const material = v.product_attribute_values_product_variants_material_idToproduct_attribute_values
      const size = v.product_attribute_values_product_variants_size_idToproduct_attribute_values
      const thickness = v.product_attribute_values_product_variants_thickness_idToproduct_attribute_values

      return {
        id: v.id,
        sku: v.sku,
        price: Number(v.price),
        compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : null,
        stock: v.inventory?.quantity_available ?? 0,
        attributes: {
          material: material?.value ?? '',
          size: size?.value ?? '',
          thickness: thickness?.value ?? '',
        },
        material_display: material?.value ?? '', // For building options tree
      }
    })

    // 1. Build Hierarchical Available Options
    const available_options: any = {}
    variants.forEach((v) => {
      const { material, size, thickness } = v.attributes

      if (!available_options[material]) {
        available_options[material] = {
          display_name: material.charAt(0).toUpperCase() + material.slice(1),
          sizes: {}
        }
      }

      if (!available_options[material].sizes[size]) {
        available_options[material].sizes[size] = []
      }

      if (!available_options[material].sizes[size].includes(thickness)) {
        available_options[material].sizes[size].push(thickness)
      }
    })

    // 2. Build Selection Map (Instant Lookup)
    const selection_map: any = {}
    variants.forEach((v) => {
      const key = `${v.attributes.material}|${v.attributes.size}|${v.attributes.thickness}`
      selection_map[key] = {
        id: v.id,
        price: v.price,
        compare_at_price: v.compare_at_price,
        sku: v.sku,
        stock: v.stock
      }
    })

    // 3. Calculate Price Range
    const prices = variants.map(v => v.price)
    const price_range = {
      min: Math.min(...prices),
      max: Math.max(...prices),
      has_discount: variants.some(v => v.compare_at_price !== null && v.compare_at_price > v.price)
    }

    const product: ProductDetail = {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      seo_description: data.seo_description,
      status: data.status ?? 'active',
      category: data.categories as any,
      product_images: data.product_images.map(img => ({
        id: img.id,
        storage_path: img.storage_path,
        alt_text: img.alt_text,
        display_order: img.display_order ?? 0,
        variant_id: img.variant_id,
        blurhash: img.blurhash
      })),
      available_options,
      selection_map,
      price_range
    }

    // Cache for 10 minutes
    await redis.setex(cacheKey, 600, JSON.stringify(product))

    return product
  } catch (error) {
    console.error('Error fetching product by slug:', slug, error)
    return null
  }
})

// ─── Get Top Product Slugs for Static Generation ─────────────────────────────

/**
 * Get slugs of top products for generateStaticParams
 * Only called at build time - no caching needed
 */
export const getTopProductSlugs = cache(async (limit: number): Promise<string[]> => {
  const data = await prisma.products.findMany({
    where: {
      status: 'active',
    },
    select: {
      slug: true,
    },
    orderBy: {
      total_sold: 'desc',
    },
    take: limit,
  })

  return data.map((p) => p.slug)
})

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

  // Fetch paginated reviews + rating summary in parallel.
  // aggregate() computes count/avg on the DB side — no need to load every
  // rating row into JS memory.
  const [reviews, ratingAgg, distribution] = await Promise.all([
    prisma.reviews.findMany({
      where: { product_id: productId, is_approved: true },
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        created_at: true,
        reviewer_name: true,
      },
      orderBy: { created_at: 'desc' },
      take: 10,
    }),

    // Single aggregate call replaces the full scan with filter loops in JS
    prisma.reviews.aggregate({
      where: { product_id: productId, is_approved: true },
      _count: { id: true },
      _avg: { rating: true },
    }),

    // Distribution per star still needs groupBy
    prisma.reviews.groupBy({
      by: ['rating'],
      where: { product_id: productId, is_approved: true },
      _count: { id: true },
    }),
  ])

  const totalCount = ratingAgg._count.id
  const averageRating = ratingAgg._avg.rating ?? 0

  const distributionMap = Object.fromEntries(
    distribution.map((d) => [d.rating, d._count.id])
  )
  const distributionResult = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: distributionMap[star] ?? 0,
  }))

  // Transform reviews to match expected format
  const transformedReviews = reviews.map((review) => ({
    ...review,
    profile: { display_name: review.reviewer_name },
  }))

  const result: ReviewsResult = {
    reviews: transformedReviews as any,
    summary: {
      totalCount,
      averageRating,
      distribution: distributionResult,
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

    try {
      const data = await prisma.products.findMany({
        where: {
          category_id: categoryId,
          status: 'active',
          id: { not: excludeProductId },
          // Only include products that have at least one in-stock variant
          product_variants: {
            some: {
              inventory: { quantity_available: { gt: 0 } },
            },
          },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          // Only fetch the 3 fields actually rendered — saves ~14 columns per image row
          product_images: {
            select: {
              storage_path: true,
              alt_text: true,
              blurhash: true,
            },
            orderBy: { display_order: 'asc' },
            take: 1,
          },
          product_variants: {
            where: {
              inventory: { quantity_available: { gt: 0 } },
            },
            select: {
              id: true,
              price: true,
              compare_at_price: true,
            },
            orderBy: { price: 'asc' },
            take: 1,
          },
        },
        orderBy: { total_sold: 'desc' },
        take: 4,
      })

      // Convert Decimal prices to numbers
      const result = data.map((product) => ({
        ...product,
        product_variants: product.product_variants.map((variant) => ({
          ...variant,
          price: Number(variant.price),
          compare_at_price: variant.compare_at_price ? Number(variant.compare_at_price) : null,
        })),
      }))

      await redis.setex(cacheKey, 600, JSON.stringify(result))
      return result
    } catch (error) {
      console.error('Error fetching related products:', error)
      return []
    }
  }
)
