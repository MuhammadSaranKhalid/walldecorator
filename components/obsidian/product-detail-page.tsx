'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ArrowLeft } from 'lucide-react'
import { getStorageUrl } from '@/lib/supabase/storage'
import { useCartStore } from '@/store/cart.store'
import { useWishlistStore } from '@/store/wishlist.store'
import { useToastStore } from '@/store/toast.store'
import { useCurrencyStore } from '@/store/currency.store'
import { formatPrice } from '@/lib/currency'
import type { ProductDetail } from '@/types/products'

interface ObsidianProductDetailPageProps {
  product: ProductDetail
}

export function ObsidianProductDetailPage({ product }: ObsidianProductDetailPageProps) {
  const { available_options, selection_map, product_images, price_range, attribute_display_names } = product

  // ── Derive ordered attribute lists ────────────────────────────────────────
  const materialKeys = Object.keys(available_options)

  const [selectedMaterial, setSelectedMaterial] = useState<string>(materialKeys[0] ?? '')

  const sizeKeys = useMemo(
    () => (selectedMaterial ? Object.keys(available_options[selectedMaterial]?.sizes ?? {}) : []),
    [selectedMaterial, available_options]
  )

  const [selectedSize, setSelectedSize] = useState<string>(sizeKeys[0] ?? '')

  const thicknessValues = useMemo(
    () => available_options[selectedMaterial]?.sizes[selectedSize] ?? [],
    [selectedMaterial, selectedSize, available_options]
  )

  const [selectedThickness, setSelectedThickness] = useState<string>(thicknessValues[0] ?? '')

  // ── Variant lookup ────────────────────────────────────────────────────────
  const variantKey = `${selectedMaterial}|${selectedSize}|${selectedThickness}`
  const currentVariant = selection_map[variantKey]
  const price = currentVariant?.price ?? price_range.min
  const compareAtPrice = currentVariant?.compare_at_price ?? null
  const stock = currentVariant?.stock ?? 0
  const isInStock = stock > 0

  const discountPct =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null

  // ── Cascade: when material changes, reset size + thickness ────────────────
  const handleMaterialChange = (material: string) => {
    setSelectedMaterial(material)
    const newSizeKeys = Object.keys(available_options[material]?.sizes ?? {})
    const newSize = newSizeKeys[0] ?? ''
    setSelectedSize(newSize)
    const newThicknesses = available_options[material]?.sizes[newSize] ?? []
    setSelectedThickness(newThicknesses[0] ?? '')
  }

  const handleSizeChange = (size: string) => {
    setSelectedSize(size)
    const newThicknesses = available_options[selectedMaterial]?.sizes[size] ?? []
    setSelectedThickness(newThicknesses[0] ?? '')
  }

  // ── Primary image ─────────────────────────────────────────────────────────
  const primaryImg = product_images.find((img) => img.is_primary) ?? product_images[0]
  const imageUrl = primaryImg?.image
    ? getStorageUrl(primaryImg.image.medium_path ?? primaryImg.image.storage_path)
    : null
  const blurhash = primaryImg?.image?.blurhash ?? null

  // Cart image for add-to-cart / wishlist
  const cartImage = primaryImg?.image
    ? {
        url: getStorageUrl(primaryImg.image.medium_path ?? primaryImg.image.storage_path),
        alt_text: primaryImg.image.alt_text,
        blurhash: primaryImg.image.blurhash,
      }
    : null

  // ── Stores ────────────────────────────────────────────────────────────────
  const { addItem: addToCart, openCart } = useCartStore()
  const { toggleItem: toggleWishlist, isInWishlist } = useWishlistStore()
  const { showSuccess } = useToastStore()
  const { currency } = useCurrencyStore()

  const isWishlisted = isInWishlist(currentVariant?.id ?? product.id)

  const handleAddToCart = () => {
    if (!currentVariant || !isInStock) return
    const materialDisplay = attribute_display_names[selectedMaterial] ?? selectedMaterial
    const sizeDisplay = attribute_display_names[selectedSize] ?? selectedSize
    addToCart({
      variantId: currentVariant.id,
      productName: product.name,
      variantDescription: `${materialDisplay} · ${sizeDisplay}`,
      sku: currentVariant.sku,
      price: currentVariant.price,
      quantity: 1,
      image: cartImage,
    })
    openCart()
    showSuccess('Added to Cart', product.name)
  }

  const handleToggleWishlist = () => {
    const variantId = currentVariant?.id ?? product.id
    toggleWishlist({
      productId: product.id,
      variantId,
      productName: product.name,
      variantDescription: product.category?.name ?? 'Wall Art',
      price,
      oldPrice: compareAtPrice ?? undefined,
      image: cartImage,
    })
    showSuccess(
      isWishlisted ? 'Removed from Wishlist' : 'Added to Wishlist',
      product.name
    )
  }

  // ── Specs rows ────────────────────────────────────────────────────────────
  const materialDisplay = attribute_display_names[selectedMaterial] ?? selectedMaterial
  const sizeDisplay = attribute_display_names[selectedSize] ?? selectedSize
  const thicknessDisplay = attribute_display_names[selectedThickness] ?? `${selectedThickness}mm`

  const specs = [
    ['Material', materialDisplay],
    ['Size', sizeDisplay],
    ['Thickness', thicknessDisplay],
    ['Mounting', 'Wall screws included'],
    ['Finish', 'Powder coated'],
  ]

  return (
    <div className="bg-[var(--obsidian-bg)]">
      {/* Sticky back-nav — sits below the main navigation (top-20 = 80px) */}
      <div className="sticky top-20 bg-[var(--obsidian-glass-bg)] backdrop-blur-[16px] border-b border-[var(--obsidian-border)] px-6 sm:px-12 py-4 flex items-center gap-5 z-10">
        <Link
          href="/products"
          className="flex items-center gap-2 text-[11px] tracking-[2px] uppercase text-[var(--obsidian-text-muted)] hover:text-[var(--obsidian-gold)] transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="text-[11px] text-[var(--obsidian-text-dim)] truncate">
          Wall Art
          {product.category?.name && (
            <>
              {' / '}
              <span className="text-[var(--obsidian-text-muted)]">{product.category.name}</span>
            </>
          )}
          {' / '}
          <span className="text-[var(--obsidian-text-muted)]">{product.name}</span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:min-h-[calc(100vh-140px)]">

        {/* Left: Image — fixed height on mobile, sticky viewport-height on desktop */}
        <div className="h-[70vw] min-h-[300px] lg:sticky lg:top-[140px] lg:h-[calc(100vh-140px)] overflow-hidden bg-[var(--obsidian-surface)] flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center relative">
            {/* Background */}
            <div className="absolute inset-0 bg-[var(--obsidian-surface2)]" />
            {/* Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(201,168,76,0.07)_0%,transparent_70%)]" />

            {/* Product image */}
            <div className="relative z-[2] w-full h-full flex items-center justify-center p-8">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={primaryImg?.image?.alt_text ?? product.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  {...(blurhash ? {} : {})}
                />
              ) : (
                <div className="text-6xl">🖼️</div>
              )}
            </div>

            {/* Discount badge */}
            {discountPct && (
              <div className="absolute top-5 left-5 z-[3] bg-[var(--obsidian-red)] text-white text-[10px] tracking-[1.5px] uppercase px-3 py-1">
                -{discountPct}%
              </div>
            )}
          </div>
        </div>

        {/* Right: Product info */}
        <div className="px-5 sm:px-8 lg:px-12 py-8 sm:py-14 overflow-y-auto">

          {/* Category badge */}
          {product.category?.name && (
            <div className="flex items-center gap-3 text-[9px] tracking-[3px] uppercase text-[var(--obsidian-gold)] mb-3.5">
              <div className="w-6 h-px bg-[var(--obsidian-gold)]" />
              {product.category.name}
            </div>
          )}

          {/* Title */}
          <h1 className="font-[family-name:var(--font-cormorant)] text-[clamp(28px,3.5vw,48px)] font-light leading-[1.1] mb-2">
            {product.name}
          </h1>

          {/* Subtitle */}
          <div className="text-xs text-[var(--obsidian-text-dim)] tracking-[1.5px] uppercase mb-5">
            Laser-cut precision art
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-4 mb-7">
            <div className="font-[family-name:var(--font-cormorant)] text-[clamp(28px,5vw,40px)] font-light text-[var(--obsidian-gold)]">
              {formatPrice(price, currency)}
            </div>
            {compareAtPrice && compareAtPrice > price && (
              <div className="text-[clamp(15px,2.5vw,20px)] text-[var(--obsidian-text-dim)] line-through">
                {formatPrice(compareAtPrice, currency)}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-[var(--obsidian-border)] mb-7" />

          {/* Description */}
          {product.description && (
            <p className="text-[13px] leading-[2.0] text-[var(--obsidian-text-muted)] mb-7 max-w-[440px]">
              {product.description}
            </p>
          )}

          {/* ── Material Selector ─────────────────────────────────────────── */}
          {materialKeys.length > 0 && (
            <div className="mb-7">
              <div className="text-[9px] tracking-[2px] uppercase text-[var(--obsidian-text-dim)] mb-3">
                Material — <span className="text-[var(--obsidian-text-muted)]">{attribute_display_names[selectedMaterial] ?? selectedMaterial}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {materialKeys.map((m) => (
                  <button
                    key={m}
                    onClick={() => handleMaterialChange(m)}
                    className={`bg-transparent border px-4 py-2 cursor-pointer font-[family-name:var(--font-dm-sans)] text-[10px] tracking-[1.5px] uppercase transition-all duration-200 ${
                      selectedMaterial === m
                        ? 'border-[var(--obsidian-gold)] text-[var(--obsidian-gold)] bg-[rgba(201,168,76,0.05)]'
                        : 'border-[var(--obsidian-border)] text-[var(--obsidian-text-muted)] hover:border-[var(--obsidian-text-muted)]'
                    }`}
                  >
                    {attribute_display_names[m] ?? m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Size Selector ─────────────────────────────────────────────── */}
          {sizeKeys.length > 0 && (
            <div className="mb-7">
              <div className="text-[9px] tracking-[2px] uppercase text-[var(--obsidian-text-dim)] mb-3">
                Size — <span className="text-[var(--obsidian-text-muted)]">{attribute_display_names[selectedSize] ?? selectedSize}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {sizeKeys.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSizeChange(s)}
                    className={`bg-transparent border px-4 py-2 cursor-pointer font-[family-name:var(--font-dm-sans)] text-[10px] tracking-[1.5px] uppercase transition-all duration-200 ${
                      selectedSize === s
                        ? 'border-[var(--obsidian-gold)] text-[var(--obsidian-gold)] bg-[rgba(201,168,76,0.05)]'
                        : 'border-[var(--obsidian-border)] text-[var(--obsidian-text-muted)] hover:border-[var(--obsidian-text-muted)]'
                    }`}
                  >
                    {attribute_display_names[s] ?? s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Thickness Selector ────────────────────────────────────────── */}
          {thicknessValues.length > 1 && (
            <div className="mb-7">
              <div className="text-[9px] tracking-[2px] uppercase text-[var(--obsidian-text-dim)] mb-3">
                Thickness — <span className="text-[var(--obsidian-text-muted)]">{attribute_display_names[selectedThickness] ?? `${selectedThickness}mm`}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {thicknessValues.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedThickness(t)}
                    className={`bg-transparent border px-4 py-2 cursor-pointer font-[family-name:var(--font-dm-sans)] text-[10px] tracking-[1.5px] uppercase transition-all duration-200 ${
                      selectedThickness === t
                        ? 'border-[var(--obsidian-gold)] text-[var(--obsidian-gold)] bg-[rgba(201,168,76,0.05)]'
                        : 'border-[var(--obsidian-border)] text-[var(--obsidian-text-muted)] hover:border-[var(--obsidian-text-muted)]'
                    }`}
                  >
                    {attribute_display_names[t] ?? `${t}mm`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Specifications ────────────────────────────────────────────── */}
          <div className="mb-7">
            <div className="text-[9px] tracking-[2px] uppercase text-[var(--obsidian-text-dim)] mb-3">
              Specifications
            </div>
            <div>
              {specs.map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between py-[9px] border-b border-[var(--obsidian-border)] text-xs"
                >
                  <span className="text-[var(--obsidian-text-muted)]">{key}</span>
                  <span className="text-[var(--obsidian-text)]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Stock indicator ───────────────────────────────────────────── */}
          {currentVariant && (
            <div className="mb-4">
              {!isInStock ? (
                <span className="text-[10px] tracking-[1px] uppercase text-[var(--obsidian-red)]">
                  Out of stock
                </span>
              ) : stock <= 5 ? (
                <span className="text-[10px] tracking-[1px] uppercase text-[var(--obsidian-gold)]">
                  Only {stock} left
                </span>
              ) : null}
            </div>
          )}

          {/* ── Actions ───────────────────────────────────────────────────── */}
          <div className="flex gap-2.5 mb-6">
            <button
              onClick={handleAddToCart}
              disabled={!isInStock}
              className={`flex-1 border-none px-7 py-4.5 cursor-pointer font-[family-name:var(--font-dm-sans)] text-[11px] tracking-[3px] uppercase font-medium transition-all duration-250 ${
                isInStock
                  ? 'bg-[var(--obsidian-gold)] text-[var(--obsidian-bg)] hover:bg-[var(--obsidian-gold-light)]'
                  : 'bg-[var(--obsidian-surface2)] text-[var(--obsidian-text-dim)] cursor-not-allowed'
              }`}
            >
              {isInStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
            <button
              onClick={handleToggleWishlist}
              className={`bg-transparent border px-5 py-4.5 cursor-pointer text-[20px] transition-all duration-250 ${
                isWishlisted
                  ? 'bg-[rgba(201,76,76,0.12)] border-[var(--obsidian-red)] text-[var(--obsidian-red)]'
                  : 'border-[var(--obsidian-border)] text-[var(--obsidian-text-muted)] hover:border-[var(--obsidian-red)] hover:text-[var(--obsidian-red)]'
              }`}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* ── Trust Badges ──────────────────────────────────────────────── */}
          <div className="flex gap-3.5 flex-wrap">
            {[
              { icon: '⚙️', text: 'Precision laser-cut' },
              { icon: '📦', text: 'Gift-boxed' },
              { icon: '✈️', text: 'Nationwide delivery' },
              { icon: '↩️', text: '30-day returns' },
            ].map((badge) => (
              <div key={badge.text} className="flex items-center gap-[7px] text-[11px] text-[var(--obsidian-text-dim)]">
                <span>{badge.icon}</span>
                <span>{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
