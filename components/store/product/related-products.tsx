import Link from 'next/link'
import Image from 'next/image'
import { getStorageUrl } from '@/lib/supabase/storage'
import { formatPrice } from '@/lib/utils'
import { blurhashToDataURL } from '@/lib/blurhash'

type RelatedProduct = {
  id: string
  name: string
  slug: string
  product_images: Array<{
    storage_path: string
    alt_text: string | null
    display_order: number
    blurhash: string | null
  }>
  product_variants: Array<{
    price: number
    compare_at_price: number | null
  }>
}

type RelatedProductsProps = {
  products: RelatedProduct[]
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) {
    return null
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => {
          const firstImage = product.product_images.sort(
            (a, b) => a.display_order - b.display_order
          )[0]
          const firstVariant = product.product_variants.sort(
            (a, b) => a.price - b.price
          )[0]
          const blurUrl = firstImage ? blurhashToDataURL(firstImage.blurhash) : undefined

          return (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group"
            >
              <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100 mb-3">
                {firstImage && (
                  <Image
                    src={getStorageUrl(firstImage.storage_path)}
                    alt={firstImage.alt_text || product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                    {...(blurUrl ? { placeholder: 'blur', blurDataURL: blurUrl } : {})}
                  />
                )}
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                {product.name}
              </h3>
              {firstVariant && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {formatPrice(firstVariant.price)}
                  </span>
                  {firstVariant.compare_at_price && (
                    <span className="text-xs text-gray-400 line-through">
                      {formatPrice(firstVariant.compare_at_price)}
                    </span>
                  )}
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
