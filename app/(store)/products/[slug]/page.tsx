import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  getProductBySlug,
  getRelatedProducts,
  getTopProductSlugs,
  getProductReviews,
} from '@/queries/product-detail'
import { getStorageUrl } from '@/lib/supabase/storage'
import { ProductGallery } from '@/components/store/product/product-gallery'
import { ProductInfo } from '@/components/store/product/product-info'
import { ProductDescription } from '@/components/store/product/product-description'
import { RelatedProducts } from '@/components/store/product/related-products'
import { ReviewSummary } from '@/components/store/product/reviews/review-summary'
import { ReviewList } from '@/components/store/product/reviews/review-list'
import { ProductBreadcrumb } from '@/components/store/product/product-breadcrumb'

// ─── ISR Configuration ───────────────────────────────────────────────────────

// Safety net: revalidate every 10 minutes even without webhook trigger
export const revalidate = 600

// dynamicParams = true: new products not in generateStaticParams
// get server-rendered on first visit, then cached as ISR pages
export const dynamicParams = true

// Pre-build top 100 products at build time
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

  if (!product) {
    return { title: 'Product Not Found' }
  }

  const firstImage = product.product_images[0]

  return {
    title: `${product.name} | Wall Decorator`,
    description: product.seo_description || product.description?.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.seo_description || product.description?.slice(0, 160),
      images: firstImage ? [{ url: getStorageUrl(firstImage.storage_path) }] : [],
    },
  }
}

// ─── Page Component ───────────────────────────────────────────────────────────

type ProductPageProps = {
  params: Promise<{ slug: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params

  // Fetch core product data — critical path
  const product = await getProductBySlug(slug)

  // Show 404 for invalid slugs or inactive products
  if (!product || product.status !== 'active') {
    notFound()
  }

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description,
            image: product.product_images.map((img) => getStorageUrl(img.storage_path)),
            offers: product.product_variants.map((v) => ({
              '@type': 'Offer',
              price: v.price,
              priceCurrency: 'PKR',
              availability:
                (v.inventory?.quantity_available ?? 0) > 0
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
            })),
          }),
        }}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <ProductBreadcrumb category={product.category} productName={product.name} />

        {/* Main product section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-6">
          {/* Left: Image Gallery */}
          <ProductGallery images={product.product_images} productName={product.name} />

          {/* Right: Product Info */}
          <ProductInfo product={product} />
        </div>

        {/* Product Description & Specs */}
        <div className="mt-16">
          <ProductDescription description={product.description} />
        </div>

        {/* Reviews — streamed separately, non-blocking */}
        <div className="mt-16">
          <Suspense
            fallback={
              <div className="animate-pulse">
                <div className="h-8 w-32 bg-gray-200 rounded mb-4" />
                <div className="h-40 bg-gray-200 rounded" />
              </div>
            }
          >
            <ReviewSection productId={product.id} />
          </Suspense>
        </div>

        {/* Related Products — streamed separately, non-blocking */}
        <div className="mt-16">
          <Suspense
            fallback={
              <div className="animate-pulse">
                <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <div className="aspect-square bg-gray-200 rounded-xl" />
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
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
      </div>
    </>
  )
}

// ─── Async Server Components for Streaming ───────────────────────────────────

async function ReviewSection({ productId }: { productId: string }) {
  const { reviews, summary } = await getProductReviews(productId)

  return (
    <>
      <ReviewSummary summary={summary} />
      <ReviewList reviews={reviews} />
    </>
  )
}

async function RelatedProductsSection({
  categoryId,
  currentProductId,
}: {
  categoryId: string
  currentProductId: string
}) {
  const related = await getRelatedProducts(categoryId, currentProductId)
  return <RelatedProducts products={related} />
}
