'use client'

import { useState, useTransition, useCallback, useRef, useEffect } from 'react'
import { useCartStore } from '@/store/cart.store'
import { formatPrice } from '@/lib/utils'
import type {
  AvailableOptions,
  SelectionMap,
  ProductDetailImage,
  SelectionVariant
} from '@/types/products'

type VariantSelectorProps = {
  productName: string
  availableOptions: AvailableOptions
  selectionMap: SelectionMap
  productImages: ProductDetailImage[]
}

export function VariantSelector({
  productName,
  availableOptions,
  selectionMap,
  productImages
}: VariantSelectorProps) {
  const [isPending, startTransition] = useTransition()
  const justAddedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [justAdded, setJustAdded] = useState(false)
  const [quantity, setQuantity] = useState(1)

  // Cleanup timer on unmount to prevent state updates on unmounted component
  useEffect(() => {
    return () => {
      if (justAddedTimerRef.current) clearTimeout(justAddedTimerRef.current)
    }
  }, [])

  const addItem = useCartStore((state) => state.addItem)
  const openCart = useCartStore((state) => state.openCart)

  // 1. Get ordered attributes from the tree keys
  const materials = Object.keys(availableOptions)

  // 2. State for selections
  const [selectedMaterial, setSelectedMaterial] = useState<string>(materials[0])

  // 3. Derive valid sizes for the selected material (computed during render — no effect needed)
  const currentMaterialOptions = availableOptions[selectedMaterial] ?? availableOptions[materials[0]]
  const availableSizes = Object.keys(currentMaterialOptions.sizes)

  // Derive corrected size: if selectedSize is no longer valid, fall back to first available
  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0])
  const validSize = availableSizes.includes(selectedSize) ? selectedSize : availableSizes[0]

  // 4. Derive thicknesses based on the valid size (computed during render — no effect needed)
  const availableThicknesses = currentMaterialOptions.sizes[validSize] ?? []
  const [selectedThickness, setSelectedThickness] = useState<string>(availableThicknesses[0])
  const validThickness = availableThicknesses.includes(selectedThickness)
    ? selectedThickness
    : availableThicknesses[0]

  // 5. Instant lookup for selected variant
  const selectionKey = `${selectedMaterial}|${validSize}|${validThickness}`
  const selectedVariant: SelectionVariant | undefined = selectionMap[selectionKey]

  const isOutOfStock = !selectedVariant || selectedVariant.stock === 0
  const isLowStock = selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 5

  const handleAddToCart = useCallback(() => {
    if (!selectedVariant || isOutOfStock) return

    startTransition(() => {
      addItem({
        variantId: selectedVariant.id,
        productName,
        variantDescription: `${selectedMaterial}, ${validSize}, ${validThickness}mm`,
        sku: selectedVariant.sku,
        price: selectedVariant.price,
        quantity,
        image: productImages[0] ?? null,
      })

      openCart()
      setJustAdded(true)
      // Store timeout ID so we can cancel it on unmount
      justAddedTimerRef.current = setTimeout(() => setJustAdded(false), 2000)
    })
  }, [selectedVariant, isOutOfStock, addItem, productName, selectedMaterial, validSize, validThickness, quantity, productImages, openCart])

  return (
    <div className="flex flex-col gap-5">
      {/* Dynamic price display */}
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-primary">
          {selectedVariant ? formatPrice(selectedVariant.price) : 'N/A'}
        </span>
        {selectedVariant?.compare_at_price ? (
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

      {/* Material Selector */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">
          Material: <span className="font-normal text-accent">{availableOptions[selectedMaterial].display_name}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {materials.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMaterial(m)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${selectedMaterial === m
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-foreground hover:border-accent'
                }`}
            >
              {availableOptions[m].display_name}
            </button>
          ))}
        </div>
      </div>

      {/* Size Selector */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">
          Size: <span className="font-normal text-accent">{selectedSize}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {availableSizes.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSize(s)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${selectedSize === s
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-foreground hover:border-accent'
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Thickness Selector */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">
          Thickness: <span className="font-normal text-accent">{selectedThickness}mm</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {availableThicknesses.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedThickness(t)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${selectedThickness === t
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-foreground hover:border-accent'
                }`}
            >
              {t}mm
            </button>
          ))}
        </div>
      </div>

      {/* Stock indicator */}
      {isLowStock && (
        <p className="text-accent text-sm font-medium">
          Only {selectedVariant.stock} left in stock
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
              onClick={() => setQuantity((q) => Math.min(selectedVariant.stock, q + 1))}
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
