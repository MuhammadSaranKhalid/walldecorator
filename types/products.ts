// ============================================================
// Product listing types for products page
// Updated for centralized images architecture
// ============================================================

import { Image } from './images'
import type { Prisma } from '@/lib/generated/prisma/client'

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

export type ProductCategory = Prisma.categoriesGetPayload<{}>

export type ProductInventory = Prisma.inventoryGetPayload<{}>

export type Category = Prisma.categoriesGetPayload<{
  include: {
    other_categories: {
      include: {
        other_categories: true
      }
    }
  }
}>

// The mapping function drops some deep relations but keeps a slim object
export type ProductVariantBase = Prisma.product_variantsGetPayload<{
  include: {
    products: {
      include: {
        product_images: {
          include: { images: true }
        }
        categories: true
      }
    }
    inventory: true
  }
}>

// Cast Prisma's Decimal (which is string/object) to number for JSON
export type ProductVariant = Omit<ProductVariantBase, 'price' | 'compare_at_price' | 'products'> & {
  price: number
  compare_at_price: number | null
  products: Omit<ProductVariantBase['products'], 'product_variants'>
}

export interface ProductsResult {
  items: ProductVariant[]
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
