export interface HomepageData {
  hero: {
    headline: string
    subheadline: string
    ctaText: string
    ctaLink: string
    imagePath: string | null
  }
  promo: {
    isActive: boolean
    headline: string
    subheadline: string
    ctaText: string
    ctaLink: string
    backgroundColor: string
  }
}

import { Image } from './images'

export interface Category {
  id: string
  name: string
  slug: string
  image_id: string | null
  images: Image | null  // From centralized images table (Prisma relation name)
  product_count: number | null
  // DEPRECATED: Use images instead
  image_path?: string | null
}

// Simple image structure for homepage display
export interface ProductImageSimple {
  storage_path: string
  alt_text: string | null
  display_order: number
  blurhash: string | null
}

export interface HomepageProduct {
  id: string
  name: string
  slug: string
  image: ProductImageSimple | null
  price: number
  compareAtPrice: number | null
}

export interface Testimonial {
  id: number
  quote: string
  author: string
  location: string
  rating: number
}

export interface TrustItem {
  icon: string
  title: string
  subtitle: string
}
