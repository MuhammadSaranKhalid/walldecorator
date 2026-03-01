// Product Card - Server Component
import Image from 'next/image'
import Link from 'next/link'
import { getStorageUrl } from '@/lib/supabase/storage'
import type { ProductVariant } from '@/types/products'
import { blurhashToDataURL } from '@/lib/blurhash'

type ProductCardProps = {
  variant: ProductVariant
  priority?: boolean
}

export function ProductCard({ variant, priority = false }: ProductCardProps) {
  const product = variant.product
  const primaryImage = product.product_images
    .sort((a, b) => a.display_order - b.display_order)[0]

  const isOnSale =
    variant.compare_at_price && variant.compare_at_price > variant.price
  const isLowStock =
    variant.inventory && variant.inventory.quantity_available <= 5

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted border border-border">
        {primaryImage ? (
          <Image
            src={getStorageUrl(primaryImage.storage_path)}
            alt={primaryImage.alt_text || product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            loading={priority ? "eager" : "lazy"}
            quality={priority ? 90 : 75}
            placeholder="blur"
            blurDataURL={blurhashToDataURL(primaryImage.blurhash)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-muted-foreground text-sm">No image</span>
          </div>
        )}

        {isOnSale && (
          <span className="absolute top-2 left-2 bg-destructive text-white text-xs px-2 py-1 rounded shadow-md">
            Sale
          </span>
        )}

        {isLowStock && variant.inventory && (
          <span className="absolute top-2 right-2 bg-accent text-accent-foreground text-xs px-2 py-1 rounded shadow-md font-semibold">
            Only {variant.inventory.quantity_available} left
          </span>
        )}
      </div>

      <div className="mt-3">
        <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-base font-semibold text-primary">
            Rs. {variant.price.toLocaleString()}
          </span>
          {isOnSale && variant.compare_at_price && (
            <span className="text-sm text-muted-foreground line-through">
              Rs. {variant.compare_at_price.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
