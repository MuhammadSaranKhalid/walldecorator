// Product Card - Server Component
import Image from 'next/image'

const pkrFormatter = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0,
})
import Link from 'next/link'
import { getStorageUrl } from '@/lib/supabase/storage'
import type { ProductListing } from '@/types/products'

type ProductCardProps = {
  product: ProductListing
  priority?: boolean
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const imagePath = product.primary_image_medium_path ?? product.primary_image_storage_path

  const isOnSale = product.compare_at_price && product.compare_at_price > product.price

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted border border-border">
        {imagePath ? (
          <Image
            src={getStorageUrl(imagePath)}
            alt={product.primary_image_alt_text || product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            priority={priority}
            quality={priority ? 90 : 75}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-muted-foreground text-sm">No image</span>
          </div>
        )}

        {isOnSale ? (
          <span className="absolute top-2 left-2 bg-destructive text-white text-xs px-2 py-1 rounded shadow-md">
            Sale
          </span>
        ) : null}
      </div>

      <div className="mt-3">
        <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-base font-semibold text-primary">
            {pkrFormatter.format(product.price)}
          </span>
          {isOnSale && product.compare_at_price ? (
            <span className="text-sm text-muted-foreground line-through">
              {pkrFormatter.format(product.compare_at_price)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
