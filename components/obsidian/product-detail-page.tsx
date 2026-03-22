'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, ArrowLeft } from 'lucide-react'
import { useCartStore } from '@/store/cart.store'
import { useWishlistStore } from '@/store/wishlist.store'
import { useToastStore } from '@/store/toast.store'

interface ProductDetailPageProps {
  product: any
}

export function ObsidianProductDetailPage({ product }: ProductDetailPageProps) {
  const [selectedMaterial, setSelectedMaterial] = useState('Powder Steel')
  const [selectedSize, setSelectedSize] = useState('M')

  const { addItem: addToCart } = useCartStore()
  const { toggleItem: toggleWishlist, isInWishlist } = useWishlistStore()
  const { showSuccess } = useToastStore()

  const isWishlisted = isInWishlist(product.id)

  const handleAddToCart = () => {
    addToCart({
      variantId: product.id,
      productName: product.name,
      variantDescription: `${selectedMaterial} - ${selectedSize}`,
      sku: product.id,
      price: product.price,
      quantity: 1,
      image: product.primary_image
        ? {
            url: product.primary_image.storage_path,
            alt_text: product.primary_image.alt_text,
            blurhash: product.primary_image.blurhash,
          }
        : null,
    })
    showSuccess('Added to Cart', product.name)
  }

  const handleToggleWishlist = () => {
    toggleWishlist({
      productId: product.id,
      variantId: product.id,
      productName: product.name,
      variantDescription: product.category?.name || 'Wall Art',
      price: product.price,
      oldPrice: product.compare_at_price || undefined,
      image: product.primary_image
        ? {
            url: product.primary_image.storage_path,
            alt_text: product.primary_image.alt_text,
            blurhash: product.primary_image.blurhash,
          }
        : null,
    })
    showSuccess(
      isWishlisted ? 'Removed from Wishlist' : 'Added to Wishlist',
      product.name
    )
  }

  const rating = 4 // Placeholder
  const reviewCount = 127 // Placeholder

  return (
    <div className="fixed inset-0 bg-[var(--obsidian-bg)] z-[150] overflow-y-auto animate-pageIn">
      {/* Sticky Navigation */}
      <div className="sticky top-0 bg-[rgba(8,8,8,0.92)] backdrop-blur-[16px] border-b border-[var(--obsidian-border)] px-6 sm:px-12 py-5 flex items-center gap-5 z-10">
        <Link
          href="/products"
          className="flex items-center gap-2 text-[11px] tracking-[2px] uppercase text-[var(--obsidian-text-muted)] hover:text-[var(--obsidian-gold)] transition-colors duration-200 bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="text-[11px] text-[var(--obsidian-text-dim)]">
          Wall Art / <span className="text-[var(--obsidian-text-muted)]">{product.category?.name}</span> /{' '}
          <span className="text-[var(--obsidian-text-muted)]">{product.name}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-70px)]">
        {/* Left: Gallery (Sticky) */}
        <div className="sticky top-[70px] h-[calc(100vh-70px)] overflow-hidden bg-[var(--obsidian-surface)] flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center relative">
            {/* Background */}
            <div className="absolute inset-0 bg-[var(--obsidian-surface2)]" />

            {/* Glow effect */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(201,168,76,0.07)_0%,transparent_70%)]" />

            {/* Product Image/Art */}
            <div className="relative z-[2] animate-heroFloat text-[clamp(80px,18vw,130px)] filter drop-shadow-[0_40px_60px_rgba(0,0,0,0.8)]">
              {product.primary_image?.storage_path ? (
                <img
                  src={product.primary_image.storage_path}
                  alt={product.primary_image.alt_text || product.name}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              ) : (
                <div className="text-6xl">🖼️</div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="px-8 sm:px-13 py-14">
          {/* Category Badge */}
          <div className="flex items-center gap-3 text-[9px] tracking-[3px] uppercase text-[var(--obsidian-gold)] mb-3.5">
            <div className="w-6 h-px bg-[var(--obsidian-gold)]" />
            {product.category?.name || 'Wall Art'}
          </div>

          {/* Title */}
          <h1 className="font-[family-name:var(--font-cormorant)] text-[clamp(32px,4vw,52px)] font-light leading-[1.1] mb-2">
            {product.name}
          </h1>

          {/* Subtitle */}
          <div className="text-xs text-[var(--obsidian-text-dim)] tracking-[1.5px] uppercase mb-5">
            Laser-cut precision art
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2.5 mb-6">
            <div className="text-[var(--obsidian-gold)] text-[13px]">
              {'★'.repeat(rating)}
              <span className="text-[var(--obsidian-text-dim)]">{'☆'.repeat(5 - rating)}</span>
            </div>
            <div className="text-[11px] text-[var(--obsidian-text-dim)]">
              ({reviewCount} reviews)
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-4 mb-7">
            <div className="font-[family-name:var(--font-cormorant)] text-[40px] font-light text-[var(--obsidian-gold)]">
              Rs. {product.price.toLocaleString()}
            </div>
            {product.compare_at_price && (
              <div className="text-[20px] text-[var(--obsidian-text-dim)] line-through">
                Rs. {product.compare_at_price.toLocaleString()}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-[var(--obsidian-border)] mb-7" />

          {/* Description */}
          <p className="text-[13px] leading-[2.0] text-[var(--obsidian-text-muted)] mb-7 max-w-[440px]">
            {product.description || 'Premium laser-cut wall art piece. Precision-crafted from high-quality materials with exceptional attention to detail.'}
          </p>

          {/* Material Selector */}
          <div className="mb-7">
            <div className="text-[9px] tracking-[2px] uppercase text-[var(--obsidian-text-dim)] mb-3">
              Material
            </div>
            <div className="flex gap-2 flex-wrap">
              {['Powder Steel', 'Hardwood', 'Acrylic'].map((material) => (
                <button
                  key={material}
                  onClick={() => setSelectedMaterial(material)}
                  className={`bg-transparent border border-[var(--obsidian-border)] px-4 py-2 cursor-pointer font-[family-name:var(--font-dm-sans)] text-[10px] tracking-[1.5px] uppercase transition-all duration-200 ${
                    selectedMaterial === material
                      ? 'border-[var(--obsidian-gold)] text-[var(--obsidian-gold)] bg-[rgba(201,168,76,0.05)]'
                      : 'text-[var(--obsidian-text-muted)] hover:border-[var(--obsidian-text-muted)]'
                  }`}
                >
                  {material}
                </button>
              ))}
            </div>
          </div>

          {/* Size Selector */}
          <div className="mb-7">
            <div className="text-[9px] tracking-[2px] uppercase text-[var(--obsidian-text-dim)] mb-3">
              Size
            </div>
            <div className="flex gap-2">
              {['S', 'M', 'L', 'XL'].map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`bg-transparent border border-[var(--obsidian-border)] w-[52px] h-[44px] cursor-pointer font-[family-name:var(--font-dm-sans)] text-[10px] tracking-[1px] uppercase transition-all duration-200 flex items-center justify-center ${
                    selectedSize === size
                      ? 'border-[var(--obsidian-gold)] text-[var(--obsidian-gold)] bg-[rgba(201,168,76,0.05)]'
                      : 'text-[var(--obsidian-text-muted)]'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Specifications */}
          <div className="mb-7">
            <div className="text-[9px] tracking-[2px] uppercase text-[var(--obsidian-text-dim)] mb-3">
              Specifications
            </div>
            <div>
              {[
                ['Material', selectedMaterial],
                ['Size', `${selectedSize === 'S' ? '30×40 cm' : selectedSize === 'M' ? '40×53 cm' : selectedSize === 'L' ? '52×70 cm' : '60×80 cm'}`],
                ['Thickness', '3mm'],
                ['Mounting', 'Wall screws included'],
                ['Finish', 'Brushed Gold'],
              ].map(([key, value]) => (
                <div key={key} className="flex justify-between py-[9px] border-b border-[var(--obsidian-border)] text-xs">
                  <span className="text-[var(--obsidian-text-muted)]">{key}</span>
                  <span className="text-[var(--obsidian-text)]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 mb-6">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-[var(--obsidian-gold)] text-[var(--obsidian-bg)] border-none px-7 py-4.5 cursor-pointer font-[family-name:var(--font-dm-sans)] text-[11px] tracking-[3px] uppercase font-medium transition-all duration-250 hover:bg-[var(--obsidian-gold-light)]"
            >
              Add to Cart
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

          {/* Trust Badges */}
          <div className="flex gap-3.5 flex-wrap">
            {[
              { icon: '⚙️', text: 'Precision laser-cut' },
              { icon: '📦', text: 'Gift-boxed' },
              { icon: '✈️', text: 'Global shipping' },
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
