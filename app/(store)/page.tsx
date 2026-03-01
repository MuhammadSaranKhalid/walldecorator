import { Suspense } from 'react'
import type { Metadata } from 'next'
import { HeroSection } from '@/components/store/home/hero-section'
import { TrustBar } from '@/components/store/home/trust-bar'
import { CategoryShowcase } from '@/components/store/home/category-showcase'
import { FeaturedProducts } from '@/components/store/home/featured-products'
import { PromoBanner } from '@/components/store/home/promo-banner'
import { Bestsellers } from '@/components/store/home/bestsellers'
import { Testimonials } from '@/components/store/home/testimonials'
import { NewsletterSection } from '@/components/store/home/newsletter-section'
import { ProductsSkeleton } from '@/components/store/home/skeletons/products-skeleton'
import { CategoriesSkeleton } from '@/components/store/home/skeletons/categories-skeleton'
import { WhatsAppButton } from '@/components/whatsapp-button'
import CustomCraftSection from '@/components/CustomCraftSection'
import {
  getHomepageData,
  getFeaturedProducts,
  getBestsellers,
  getCategories,
} from '@/queries/home'

export const metadata: Metadata = {
  title: 'Wall Decorator — Shop the Latest Collection',
  description:
    'Discover our curated collection of premium metal wall art. Free shipping over Rs. 5,000.',
  openGraph: {
    title: 'Wall Decorator',
    description: 'Shop our latest collection of metal wall art.',
    type: 'website',
  },
}

// ISR Configuration — Revalidate every 30 minutes
// Use on-demand revalidation from admin for instant updates
export const revalidate = 1800

export default async function HomePage() {
  // Fetch only the homepage config (hero text, promo banner data)
  // This is fast — one small Redis-cached row
  const homepageData = await getHomepageData()

  return (
    <main>
      {/* ── 1. HERO ─────────────────────────────────────────────── */}
      {/* Fully static markup + data from homepageData */}
      {/* Always above the fold — zero loading state */}
      <HeroSection data={homepageData.hero} />

      {/* ── 2. TRUST BAR ────────────────────────────────────────── */}
      {/* Fully static — no data needed */}
      <TrustBar />

      {/* ── 3. CATEGORY SHOWCASE ────────────────────────────────── */}
      {/* Streamed — categories are fast but we don't block hero */}
      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoryShowcaseSection />
      </Suspense>

      {/* ── 4. FEATURED PRODUCTS ────────────────────────────────── */}
      {/* Streamed — independent of categories */}
      <Suspense fallback={<ProductsSkeleton title="Featured Products" />}>
        <FeaturedProductsSection />
      </Suspense>

      {/* ── 5. PROMO BANNER ─────────────────────────────────────── */}
      {/* Static markup, data from homepageData (already fetched) */}
      {homepageData.promo.isActive && (
        <PromoBanner data={homepageData.promo} />
      )}

      {/* ── 6. BESTSELLERS ──────────────────────────────────────── */}
      {/* Streamed — independent section */}
      <Suspense fallback={<ProductsSkeleton title="Bestsellers" />}>
        <BestsellersSection />
      </Suspense>

      {/* ── 7. TESTIMONIALS ─────────────────────────────────────── */}
      {/* Fully static — hardcoded or from CMS, no DB needed */}
      <Testimonials />

      {/* ── 8. CUSTOM CRAFT ─────────────────────────────────────── */}
      {/* Client Component — custom order form with file upload */}
      <CustomCraftSection />

      {/* ── 9. NEWSLETTER ───────────────────────────────────────── */}
      {/* Client Component — needs form interactivity */}
      <NewsletterSection />

      {/* ── 9. WHATSAPP BUTTON ──────────────────────────────────── */}
      {/* Floating WhatsApp button for customer support */}
      <WhatsAppButton />
    </main>
  )
}

// ─── Async Server Components for Streaming ────────────────────────────────────
// Each is an independent async Server Component.
// Wrapped in Suspense above — they stream in parallel.
// The hero and trust bar are visible instantly while these load.

async function CategoryShowcaseSection() {
  const categories = await getCategories()
  return <CategoryShowcase categories={categories} />
}

async function FeaturedProductsSection() {
  const products = await getFeaturedProducts()
  return <FeaturedProducts products={products} />
}

async function BestsellersSection() {
  const products = await getBestsellers()
  return <Bestsellers products={products} />
}
