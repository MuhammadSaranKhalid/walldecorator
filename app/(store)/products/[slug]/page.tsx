import { Suspense, use } from 'react'
import { notFound } from 'next/navigation'
import { after } from 'next/server'
import type { Metadata } from 'next'
import { incrementProductViewCount } from '@/actions/product'
import {
  getProductBySlug,
  getRelatedProducts,
  getTopProductSlugs,
  getProductReviews,
} from '@/queries/product-detail'
import { getStorageUrl } from '@/lib/supabase/storage'
import { ObsidianProductDetailPage } from '@/components/obsidian/product-detail-page'
import { RelatedProducts } from '@/components/store/product/related-products'
import { ReviewSummary } from '@/components/store/product/reviews/review-summary'
import { ReviewList } from '@/components/store/product/reviews/review-list'

// ─── ISR Configuration ───────────────────────────────────────────────────────

export const revalidate = 600
export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = await getTopProductSlugs(100)
  return slugs.map((slug) => ({ slug }))
}

// ─── Dynamic SEO Metadata ─────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) return { title: 'Product Not Found' }

  const firstImage = product.product_images[0]

  return {
    title: product.name,
    description: product.seo_description || product.description?.slice(0, 160),
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      title: product.name,
      description: product.seo_description || product.description?.slice(0, 160),
      type: 'website',
      images: firstImage
        ? [{ url: getStorageUrl(firstImage.image.storage_path), alt: product.name }]
        : [],
    },
  }
}

// ─── Page Component ───────────────────────────────────────────────────────────

type ProductPageProps = {
  params: Promise<{ slug: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product || product.status !== 'active') notFound()

  after(() => {
    incrementProductViewCount(product.id).catch(console.error)
  })

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description,
            brand: { '@type': 'Brand', name: 'Wall Decorator' },
            image: product.product_images.map((img) =>
              getStorageUrl(img.image.storage_path)
            ),
            offers: Object.values(product.selection_map).map((v) => ({
              '@type': 'Offer',
              price: v.price,
              priceCurrency: 'PKR',
              availability:
                v.stock > 0
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
            })),
          }),
        }}
      />

      {/* Main product detail — full obsidian design */}
      <ObsidianProductDetailPage product={product} />

      {/* Reviews — streamed below, non-blocking */}
      <div className="container mx-auto px-6 sm:px-12 mt-16 mb-8">
        <Suspense
          fallback={
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-32 bg-[var(--obsidian-surface2)] rounded" />
              <div className="h-40 bg-[var(--obsidian-surface2)] rounded" />
            </div>
          }
        >
          <ReviewSection productId={product.id} />
        </Suspense>
      </div>

      {/* Related Products — streamed below, only when category exists */}
      {product.category && (
        <div className="container mx-auto px-6 sm:px-12 mt-8 mb-16">
          <Suspense
            fallback={
              <div className="animate-pulse space-y-4">
                <div className="h-8 w-48 bg-[var(--obsidian-surface2)] rounded" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <div className="aspect-square bg-[var(--obsidian-surface2)] rounded" />
                      <div className="h-4 bg-[var(--obsidian-surface2)] rounded w-3/4" />
                    </div>
                  ))}
                </div>
              </div>
            }
          >
            <RelatedProductsSection
              categoryId={product.category.id}
              currentProductId={product.id}
            />
          </Suspense>
        </div>
      )}
    </>
  )
}

// ─── Streamed Server Components ───────────────────────────────────────────────

function ReviewSection({ productId }: { productId: string }) {
  const { reviews, summary } = use(getProductReviews(productId))
  return (
    <>
      <ReviewSummary summary={summary} />
      <ReviewList reviews={reviews} />
    </>
  )
}

function RelatedProductsSection({
  categoryId,
  currentProductId,
}: {
  categoryId: string
  currentProductId: string
}) {
  const related = use(getRelatedProducts(categoryId, currentProductId))
  return <RelatedProducts products={related} />
}
