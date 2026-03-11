// Product listing types for products page
export interface ProductImage {
  storage_path: string
  alt_text: string | null
  display_order: number
  blurhash: string | null
}

export interface ProductCategory {
  id: string
  name: string
  slug: string
}

export interface ProductInventory {
  quantity_available: number
}

export interface ProductVariant {
  id: string
  price: number
  compare_at_price: number | null
  sku: string
  products: {
    id: string
    name: string
    slug: string
    product_images: ProductImage[]
    categories: ProductCategory | null
  }
  inventory: ProductInventory | null
}

export interface ProductsResult {
  items: ProductVariant[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
}

export interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
  other_categories?: Category[]
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

export interface ProductDetailImage {
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
