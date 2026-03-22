import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ObsidianHeroSection } from '@/components/obsidian/hero-section'
import { MaterialStrip } from '@/components/obsidian/material-strip'
import { ObsidianProductsPage } from '@/components/obsidian/products-page'
import { getProducts } from '@/queries/products'
import { getHomepageData } from '@/queries/home'

export const metadata: Metadata = {
  title: 'OBSIDIAN — Wall Art & Decor',
  description:
    'Precision-crafted laser-cut designs that turn your walls into a gallery. Premium materials, custom sizes. Free shipping over Rs. 5,000.',
  openGraph: {
    title: 'OBSIDIAN — Wall Art & Decor',
    description: 'Precision-crafted laser-cut wall art. Premium materials, custom sizes.',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'OBSIDIAN — Wall Art & Decor' }],
  },
}

// ISR Configuration — Revalidate every 30 minutes
export const revalidate = 1800

export default async function HomePage() {
  // Fetch homepage config
  const homepageData = await getHomepageData()

  return (
    <main className="relative z-1">
      {/* ── 1. HERO ─────────────────────────────────────────────── */}
      <ObsidianHeroSection
        title="Where"
        subtitle="Passion"
        titleLine3="Meets Wall"
        eyebrow="Laser-Cut Wall Art Decorator Pieces"
        description="Premium metal & wood silhouette art spanning anime, cinema, nature, and life. Each piece is precision laser-cut and ready to transform your space."
        primaryCTA={{ text: 'Browse All Pieces', href: '#shop' }}
        secondaryCTA={{ text: 'View Collections', href: '/collections' }}
        categories={['Anime', 'Movies', 'Gaming', 'Nature', 'Sports', 'Abstract']}
      />

      {/* ── 2. MATERIAL STRIP ───────────────────────────────────── */}
      <MaterialStrip />

      {/* ── 3. SHOP SECTION (Categories + Products Grid) ────────── */}
      <div id="shop">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading products...</div>}>
          <ShopSection />
        </Suspense>
      </div>
    </main>
  )
}

// ─── Server Component for Shop Section ─────────────

async function ShopSection() {
  // Fetch all products for the shop section
  // Pass empty string for category to get all products (null/empty = no category filter)
  const products = await getProducts({ category: '', sort: 'newest', page: 1, limit: 100 })

  return <ObsidianProductsPage initialProducts={products.items} />
}
