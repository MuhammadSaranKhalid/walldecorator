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

export interface Category {
  id: string
  name: string
  slug: string
  image_path: string | null
  product_count: number
}

export interface ProductImage {
  storage_path: string
  alt_text: string | null
  display_order: number
}

export interface HomepageProduct {
  id: string
  name: string
  slug: string
  image: ProductImage | null
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
