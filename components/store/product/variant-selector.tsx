'use client'

import { useState, useTransition, useMemo } from 'react'
import { useCartStore } from '@/store/cart.store'
import { formatPrice } from '@/lib/utils'
import type { ProductDetailVariant, ProductDetailImage } from '@/types/products'

type VariantSelectorProps = {
  productName: string
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

export function VariantSelector({ productName, variants, productImages }: VariantSelectorProps) {
  const [quantity, setQuantity] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [justAdded, setJustAdded] = useState(false)

  const addItem = useCartStore((state) => state.addItem)
  const openCart = useCartStore((state) => state.openCart)

  // 1. Determine cascade order from first variant
  const attributeOrder = useMemo(() => {
    if (!variants.length) return []
    return variants[0].product_attribute_values.map((av) => av.attribute.name)
  }, [variants])

  // 2. Track selected attribute values
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>(
    () => getDefaultAttributes(variants[0])
  )

  // 3. Find active variant based on exact selection match
  const selectedVariant = useMemo(() => {
    return variants.find((v) =>
      v.product_attribute_values.every((av) => selectedAttributes[av.attribute.name] === av.value)
    ) || variants[0]
  }, [variants, selectedAttributes])

  // 4. Calculate available options for each level in the cascade
  const attributeGroups = useMemo(() => {
    const result: Record<string, string[]> = {}

    attributeOrder.forEach((attrName, index) => {
      const precedingAttrs = attributeOrder.slice(0, index)

      // Filter to variants that match the current upstream selections
      const eligibleVariants = variants.filter((v) =>
        precedingAttrs.every((upstreamAttr) => {
          const variantVal = v.product_attribute_values.find((av) => av.attribute.name === upstreamAttr)?.value
          return variantVal === selectedAttributes[upstreamAttr]
        })
      )

      // Collect all available values for *this* attribute from the eligible variants
      const values = eligibleVariants.flatMap(
        (v) => v.product_attribute_values.find((av) => av.attribute.name === attrName)?.value ?? []
      )

      // Deduplicate and sort
      result[attrName] = [...new Set(values)].sort()
    })

    return result
  }, [variants, attributeOrder, selectedAttributes])

  function handleAttributeChange(attributeName: string, value: string) {
    const changedIndex = attributeOrder.indexOf(attributeName)
    const newSelections = { ...selectedAttributes, [attributeName]: value }

    // Auto-advance checking downstream validity
    const downstreamAttrs = attributeOrder.slice(changedIndex + 1)

    let currentEligible = variants.filter(v => {
      return Object.entries(newSelections).every(([k, val]) => {
        if (attributeOrder.indexOf(k) > changedIndex) return true
        return v.product_attribute_values.find(av => av.attribute.name === k)?.value === val
      })
    })

    for (const dAttr of downstreamAttrs) {
      const validDownstreamValues = [...new Set(currentEligible.flatMap(v =>
        v.product_attribute_values.find(av => av.attribute.name === dAttr)?.value ?? []
      ))]

      if (!validDownstreamValues.includes(newSelections[dAttr])) {
        // Auto-pick the first valid one
        newSelections[dAttr] = validDownstreamValues[0] ?? ''
      }

      currentEligible = currentEligible.filter(v =>
        v.product_attribute_values.find(av => av.attribute.name === dAttr)?.value === newSelections[dAttr]
      )
    }

    setSelectedAttributes(newSelections)
    setQuantity(1)
  }

  const stockAvailable = selectedVariant?.inventory?.quantity_available ?? 0
  const isOutOfStock = stockAvailable === 0
  const isLowStock = stockAvailable > 0 && stockAvailable <= 5

  function handleAddToCart() {
    if (isOutOfStock) return

    startTransition(() => {
      addItem({
        variantId: selectedVariant.id,
        productName,
        variantDescription: formatVariantDescription(selectedVariant),
        sku: selectedVariant.sku,
        price: selectedVariant.price,
        quantity,
        image: productImages[0] ?? null,
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
        {selectedVariant.compare_at_price ? (
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
        ) : null}
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
                    ${isSelected
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
          ${isOutOfStock
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
