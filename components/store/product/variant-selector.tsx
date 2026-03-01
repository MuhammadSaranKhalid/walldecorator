'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useCartStore } from '@/store/cart.store'
import { formatPrice } from '@/lib/utils'
import { incrementProductViewCount } from '@/actions/product'
import type { ProductDetailVariant, ProductDetailImage, ProductDetail } from '@/types/products'

type VariantSelectorProps = {
  product: ProductDetail
  variants: ProductDetailVariant[]
  productImages: ProductDetailImage[]
}

// Helper function to group variants by attribute
function groupVariantsByAttribute(variants: ProductDetailVariant[]) {
  const groups: Record<string, Set<string>> = {}

  variants.forEach((variant) => {
    variant.product_attribute_values.forEach((av) => {
      const attrName = av.attribute.name
      if (!groups[attrName]) {
        groups[attrName] = new Set()
      }
      groups[attrName].add(av.value)
    })
  })

  // Convert Sets to sorted arrays
  const result: Record<string, string[]> = {}
  Object.entries(groups).forEach(([name, values]) => {
    result[name] = Array.from(values).sort()
  })

  return result
}

// Helper to get default attributes from a variant
function getDefaultAttributes(variant: ProductDetailVariant): Record<string, string> {
  const attrs: Record<string, string> = {}
  variant.product_attribute_values.forEach((av) => {
    attrs[av.attribute.name] = av.value
  })
  return attrs
}

// Helper to format variant description (e.g., "Red, Large")
function formatVariantDescription(variant: ProductDetailVariant): string {
  return variant.product_attribute_values.map((av) => av.value).join(', ')
}

export function VariantSelector({ product, variants, productImages }: VariantSelectorProps) {
  const [selectedVariant, setSelectedVariant] = useState(variants[0])
  const [quantity, setQuantity] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [justAdded, setJustAdded] = useState(false)
  const hasTrackedView = useRef(false)

  const addItem = useCartStore((state) => state.addItem)
  const openCart = useCartStore((state) => state.openCart)

  // Track product view once on mount
  useEffect(() => {
    if (hasTrackedView.current) return
    hasTrackedView.current = true

    // Fire and forget - don't block UI
    incrementProductViewCount(product.id).catch(console.error)
  }, [product.id])

  // Group variants by attribute for rendering selectors
  const attributeGroups = groupVariantsByAttribute(variants)

  // Track selected attribute values
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>(
    () => getDefaultAttributes(variants[0])
  )

  function handleAttributeChange(attributeName: string, value: string) {
    const newAttributes = { ...selectedAttributes, [attributeName]: value }
    setSelectedAttributes(newAttributes)

    // Find the variant that matches all selected attributes
    const matchingVariant = variants.find((v) =>
      v.product_attribute_values.every((av) => newAttributes[av.attribute.name] === av.value)
    )
    if (matchingVariant) {
      setSelectedVariant(matchingVariant)
    }
  }

  const stockAvailable = selectedVariant.inventory?.quantity_available ?? 0
  const isOutOfStock = stockAvailable === 0
  const isLowStock = stockAvailable > 0 && stockAvailable <= 5

  function handleAddToCart() {
    if (isOutOfStock) return

    startTransition(() => {
      addItem({
        variantId: selectedVariant.id,
        productName: product.name,
        variantDescription: formatVariantDescription(selectedVariant),
        sku: selectedVariant.sku,
        price: selectedVariant.price,
        quantity,
        image: productImages.find((img) => img.variant_id === selectedVariant.id) ?? productImages[0] ?? null,
      })

      // Open cart drawer immediately
      openCart()

      // Show "Added!" feedback on button
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 2000)
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Dynamic price display */}
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-primary">
          {formatPrice(selectedVariant.price)}
        </span>
        {selectedVariant.compare_at_price && (
          <>
            <span className="text-muted-foreground line-through text-lg">
              {formatPrice(selectedVariant.compare_at_price)}
            </span>
            <span className="bg-destructive/10 text-destructive text-sm px-2 py-0.5 rounded-full font-semibold">
              {Math.round(
                ((selectedVariant.compare_at_price - selectedVariant.price) /
                  selectedVariant.compare_at_price) *
                  100
              )}
              % off
            </span>
          </>
        )}
      </div>

      {/* Attribute selectors (Size, Color, etc.) */}
      {Object.entries(attributeGroups).map(([attributeName, values]) => (
        <div key={attributeName}>
          <p className="text-sm font-medium text-foreground mb-2">
            {attributeName}:
            <span className="font-normal ml-1 text-accent">{selectedAttributes[attributeName]}</span>
          </p>

          <div className="flex flex-wrap gap-2">
            {values.map((value) => {
              const isSelected = selectedAttributes[attributeName] === value
              const variantForValue = variants.find((v) =>
                v.product_attribute_values.some(
                  (av) => av.attribute.name === attributeName && av.value === value
                )
              )
              const isUnavailable = variantForValue?.inventory?.quantity_available === 0

              return (
                <button
                  key={value}
                  onClick={() => handleAttributeChange(attributeName, value)}
                  disabled={isUnavailable}
                  className={`
                    px-4 py-2 rounded-lg border text-sm font-medium
                    transition-all duration-150
                    ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isUnavailable
                          ? 'border-border text-muted-foreground/40 cursor-not-allowed line-through'
                          : 'border-border text-foreground hover:border-accent'
                    }
                  `}
                >
                  {value}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Stock indicator */}
      {isLowStock && (
        <p className="text-accent text-sm font-medium">
          Only {stockAvailable} left in stock
        </p>
      )}

      {/* Quantity selector */}
      {!isOutOfStock && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">Quantity:</span>
          <div className="flex items-center border border-border rounded-lg">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-2 text-muted-foreground hover:bg-secondary rounded-l-lg"
            >
              −
            </button>
            <span className="px-4 py-2 text-sm font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(stockAvailable, q + 1))}
              className="px-3 py-2 text-muted-foreground hover:bg-secondary rounded-r-lg"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={isOutOfStock || isPending}
        className={`
          w-full py-4 rounded-xl font-semibold text-base
          transition-all duration-200 shadow-lg
          ${
            isOutOfStock
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : justAdded
                ? 'bg-accent text-accent-foreground scale-[0.99]'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-xl active:scale-[0.99]'
          }
        `}
      >
        {isOutOfStock ? 'Out of Stock' : justAdded ? '✓ Added to Cart' : 'Add to Cart'}
      </button>
    </div>
  )
}
