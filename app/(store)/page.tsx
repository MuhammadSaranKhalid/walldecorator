import { Suspense, use } from 'react'
import type { Metadata } from 'next'
import { HeroSection } from '@/components/store/home/hero-section'
import { TrustBar } from '@/components/store/home/trust-bar'
import { CategoryShowcase } from '@/components/store/home/category-showcase'
import { FeaturedProducts } from '@/components/store/home/featured-products'
import { PromoBanner } from '@/components/store/home/promo-banner'
import { Bestsellers } from '@/components/store/home/bestsellers'
import { NewArrivals } from '@/components/store/home/new-arrivals'
import { Testimonials } from '@/components/store/home/testimonials'
import { NewsletterSection } from '@/components/store/home/newsletter-section'
import { FadeInSection } from '@/components/store/home/fade-in-section'
import { ProductsSkeleton } from '@/components/store/home/skeletons/products-skeleton'
import { CategoriesSkeleton } from '@/components/store/home/skeletons/categories-skeleton'
import { WhatsAppButton } from '@/components/whatsapp-button'
import { CustomCraftTeaser } from '@/components/store/home/custom-craft-teaser'
import {
  getHomepageData,
  getFeaturedProducts,
  getBestsellers,
  getNewArrivals,
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
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Wall Decorator — Metal Wall Art' }],
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
      {/* No FadeInSection — always above the fold, loads instantly */}
      <HeroSection data={homepageData.hero} />

      {/* ── 2. TRUST BAR ────────────────────────────────────────── */}
      <FadeInSection>
        <TrustBar />
      </FadeInSection>

      {/* ── 3. CATEGORY SHOWCASE ────────────────────────────────── */}
      <FadeInSection>
        <Suspense fallback={<CategoriesSkeleton />}>
          <CategoryShowcaseSection />
        </Suspense>
      </FadeInSection>

      {/* ── 4. FEATURED PRODUCTS ────────────────────────────────── */}
      <FadeInSection>
        <Suspense fallback={<ProductsSkeleton title="Featured Products" />}>
          <FeaturedProductsSection />
        </Suspense>
      </FadeInSection>

      {/* ── 5. PROMO BANNER ─────────────────────────────────────── */}
      {homepageData.promo.isActive ? (
        <FadeInSection>
          <PromoBanner data={homepageData.promo} />
        </FadeInSection>
      ) : null}

      {/* ── 6. BESTSELLERS ──────────────────────────────────────── */}
      <FadeInSection>
        <Suspense fallback={<ProductsSkeleton title="Bestsellers" />}>
          <BestsellersSection />
        </Suspense>
      </FadeInSection>

      {/* ── 7. NEW ARRIVALS ─────────────────────────────────────── */}
      <FadeInSection>
        <Suspense fallback={<ProductsSkeleton title="New Arrivals" />}>
          <NewArrivalsSection />
        </Suspense>
      </FadeInSection>

      {/* ── 8. TESTIMONIALS ─────────────────────────────────────── */}
      <FadeInSection>
        <Testimonials />
      </FadeInSection>

      {/* ── 9. CUSTOM CRAFT ─────────────────────────────────────── */}
      <FadeInSection>
        <CustomCraftTeaser />
      </FadeInSection>

      {/* ── 10. NEWSLETTER ──────────────────────────────────────── */}
      <FadeInSection>
        <NewsletterSection />
      </FadeInSection>

      {/* ── FLOATING WHATSAPP ───────────────────────────────────── */}
      <WhatsAppButton />
    </main>
  )
}

// ─── Server Components for Streaming (React 19 with use() hook) ─────────────
// Each is an independent Server Component using React 19's use() hook.
// Wrapped in Suspense above — they stream in parallel.
// The hero and trust bar are visible instantly while these load.

function CategoryShowcaseSection() {
  const categories = use(getCategories())
  return <CategoryShowcase categories={categories} />
}

function FeaturedProductsSection() {
  const products = use(getFeaturedProducts())
  return <FeaturedProducts products={products} />
}

function BestsellersSection() {
  const products = use(getBestsellers())
  return <Bestsellers products={products} />
}

function NewArrivalsSection() {
  const products = use(getNewArrivals())
  return <NewArrivals products={products} />
}
