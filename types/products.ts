// ============================================================
// Product listing types for products page
// Updated for Drizzle ORM (was Prisma)
// ============================================================

import { Image } from './images'
import type {
  categories,
  products,
} from '@/lib/db/schema'

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

// Product listing row — product-centric, no variant join needed.
// min_price / min_compare_at_price are denormalized on products (trigger-maintained).
export type ProductListing = Omit<typeof products.$inferSelect, 'min_price' | 'min_compare_at_price'> & {
  price: number
  compare_at_price: number | null
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
  category: ProductCategory
  product_images: ProductDetailImage[]
  available_options: AvailableOptions
  selection_map: SelectionMap
  price_range: {
    min: number
    max: number
    has_discount: boolean
  }
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
