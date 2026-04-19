import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ObsidianHeroSection } from '@/components/obsidian/hero-section'
import { MaterialStrip } from '@/components/obsidian/material-strip'
import { ObsidianProductsPage } from '@/components/obsidian/products-page'
import { getProducts, getProductCategories } from '@/queries/products'
import { getHomepageData } from '@/queries/home'

export const metadata: Metadata = {
  title: 'Wall Decorator — Modern Wall Art',
  description:
    'Precision-crafted laser-cut designs that turn your walls into a gallery. Premium materials, custom sizes. Free shipping on all orders.',
  openGraph: {
    title: 'Wall Decorator — Modern Wall Art',
    description: 'Precision-crafted laser-cut wall art. Premium materials, custom sizes.',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Wall Decorator — Modern Wall Art' }],
  },
}

// ISR Configuration — Revalidate every 30 minutes
export const revalidate = 1800

export default async function HomePage() {
  const [homepageData, categories] = await Promise.all([
    getHomepageData(),
    getProductCategories(),
  ])

  return (
    <main className="relative z-1">
      {/* ── 1. HERO ─────────────────────────────────────────────── */}
      <ObsidianHeroSection categories={categories} />

      {/* ── 2. MATERIAL STRIP ───────────────────────────────────── */}
      <MaterialStrip />

      {/* ── 3. SHOP SECTION (Categories + Products Grid) ────────── */}
      <div id="shop">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading products...</div>}>
          <ShopSection categories={categories} />
        </Suspense>
      </div>
    </main>
  )
}

// ─── Server Component for Shop Section ─────────────

async function ShopSection({ categories }: { categories: Awaited<ReturnType<typeof getProductCategories>> }) {
  const products = await getProducts({ category: '', sort: 'newest', page: 1, limit: 100 })

  return (
    <ObsidianProductsPage
      initialProducts={products.items}
      categories={categories}
      totalCount={products.totalCount}
      currentPage={1}
      totalPages={1}
      currentCategory=""
      currentSort="newest"
    />
  )
}
