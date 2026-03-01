import { VariantSelector } from './variant-selector'
import { StockBadge } from './stock-badge'
import { ShareButton } from './share-button'
import type { ProductDetail } from '@/types/products'

type ProductInfoProps = {
  product: ProductDetail
}

// Server Component
export function ProductInfo({ product }: ProductInfoProps) {
  const defaultVariant = product.product_variants[0]

  return (
    <div className="flex flex-col">
      {/* Product Name */}
      <h1 className="text-3xl font-bold text-primary">{product.name}</h1>

      {/* Stock Badge */}
      <div className="mt-3">
        <StockBadge inventory={defaultVariant?.inventory ?? null} />
      </div>

      {/* Variant Selector — Client Component (needs interactivity) */}
      <div className="mt-6">
        <VariantSelector
          product={product}
          variants={product.product_variants}
          productImages={product.product_images}
        />
      </div>

      {/* Trust signals */}
      <div className="flex flex-col gap-2 mt-6 p-4 bg-secondary/50 border border-border rounded-xl text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="text-accent">✓</span>
          <span>Free shipping on orders over Rs 5,000</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-accent">✓</span>
          <span>30-day hassle-free returns</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-accent">✓</span>
          <span>Secure checkout</span>
        </div>
      </div>

      {/* Share Button */}
      <div className="mt-4">
        <ShareButton title={product.name} url={`/products/${product.slug}`} />
      </div>
    </div>
  )
}
