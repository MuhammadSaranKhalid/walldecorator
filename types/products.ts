// ============================================================
// Product listing types for products page
// Updated for Drizzle ORM (was Prisma)
// ============================================================

import { Image } from './images'
import type { categories } from '@/lib/db/schema'

// Junction table data + centralized image data
export interface ProductImage {
  display_order: number
  is_primary: boolean
  variant_id: string | null
  image: Image  // From centralized images table
}

// Simplified version for listings (backward compatible)
export interface ProductImageSimple {
  storage_path: string
  alt_text: string | null
  display_order: number
  blurhash: string | null
}

export type ProductCategory = typeof categories.$inferSelect


export type Category = typeof categories.$inferSelect & {
  other_categories: (typeof categories.$inferSelect & {
    other_categories: (typeof categories.$inferSelect)[]
  })[]
}

// Product listing row — only the columns selected in getProducts query.
// price / compare_at_price are normalized from min_price / min_compare_at_price.
export interface ProductListing {
  id: string
  name: string
  slug: string
  description: string | null
  status: string | null
  category_id: string | null
  is_featured: boolean | null
  total_sold: number | null
  view_count: number | null
  seo_title: string | null
  seo_description: string | null
  primary_image_storage_path: string | null
  primary_image_medium_path: string | null
  primary_image_blurhash: string | null
  primary_image_alt_text: string | null
  created_at: Date
  updated_at: Date
  price: number
  compare_at_price: number | null
  categories: { id: string; name: string; slug: string } | null
}

export interface ProductsResult {
  items: ProductListing[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
}

export interface AttributeValue {
  value: string
  attribute: {
    name: string
  }
}

export interface FilterAttribute {
  name: string
  values: string[]
}

export interface SelectionVariant {
  id: string
  price: number
  compare_at_price: number | null
  sku: string
  stock: number
}

export interface SelectionMap {
  [key: string]: SelectionVariant
}

export interface MaterialOptions {
  display_name: string
  sizes: {
    [size: string]: string[] // [thicknesses]
  }
}

export interface AvailableOptions {
  [material: string]: MaterialOptions
}

// Product detail image (junction table + centralized image)
export interface ProductDetailImage {
  display_order: number
  is_primary: boolean
  variant_id: string | null
  image: Image  // From centralized images table
}

// Simplified version for cart/checkout (backward compatible)
export interface ProductDetailImageSimple {
  id: string
  storage_path: string
  alt_text: string | null
  display_order: number
  variant_id: string | null
  blurhash: string | null
}

export interface ProductDetail {
  id: string
  name: string
  slug: string
  description: string | null
  seo_description: string | null
  status: string
  category: ProductCategory | null
  product_images: ProductDetailImage[]
  available_options: AvailableOptions
  selection_map: SelectionMap
  price_range: {
    min: number
    max: number
    has_discount: boolean
  }
  /** Maps raw attribute values to display names. e.g. "steel" → "Steel", "2x2" → "2ft × 2ft", "1.2" → "1.2mm" */
  attribute_display_names: Record<string, string>
}

export type CategoryWithSubs = {
  id: string
  name: string
  slug: string
  description: string | null
  product_count: number
  subcategories: {
    id: string
    name: string
    slug: string
    product_count: number
  }[]
}

export interface ReviewSummary {
  totalCount: number
  averageRating: number
  distribution: {
    star: number
    count: number
  }[]
}

export interface Review {
  id: string
  rating: number
  title: string | null
  body: string | null
  created_at: string
  profile: {
    display_name: string | null
  } | null
}

export interface ReviewsResult {
  reviews: Review[]
  summary: ReviewSummary
}
