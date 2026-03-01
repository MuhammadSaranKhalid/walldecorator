import Image from 'next/image'
import Link from 'next/link'
import { getStorageUrl } from '@/lib/supabase/storage'
import { formatPrice } from '@/lib/utils/format'
import type { HomepageProduct } from '@/types/homepage'

type ProductRowProps = {
  products: HomepageProduct[]
  priority?: boolean
}

/**
 * Reusable product row component
 * Horizontal scroll on mobile, grid on desktop
 */
export function ProductRow({ products, priority = false }: ProductRowProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No products to display
      </div>
    )
  }

  return (
    <div
      className="
        flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory
        md:grid md:grid-cols-4 md:overflow-visible md:pb-0
        scrollbar-hide
      "
    >
      {products.map((product, index) => (
        <Link
          key={product.id}
          href={`/products/${product.slug}`}
          className="group shrink-0 w-[70vw] sm:w-[45vw] md:w-auto snap-start"
        >
          {/* Image */}
          <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
            {product.image && (
              <Image
                src={getStorageUrl(product.image.storage_path)}
                alt={product.image.alt_text || product.name}
                fill
                priority={priority && index < 4}
                sizes="(max-width: 768px) 70vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            )}
            {product.compareAtPrice && (
              <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                Sale
              </span>
            )}
          </div>

          {/* Info */}
          <div className="mt-3 space-y-1">
            <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-gray-600 transition-colors">
              {product.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {formatPrice(product.price)}
              </span>
              {product.compareAtPrice && (
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
