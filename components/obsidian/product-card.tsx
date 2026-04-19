'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { useWishlistStore } from '@/store/wishlist.store'
import { useToastStore } from '@/store/toast.store'
import { getStorageUrl } from '@/lib/supabase/storage'
import { useCurrencyStore } from '@/store/currency.store'
import { formatPrice } from '@/lib/currency'

interface ProductCardProps {
  product: any // Flexible type to accept different product structures
  badge?: 'new' | 'sale' | 'hot' | 'limited' | null
  animationDelay?: number
}

export function ObsidianProductCard({ product, badge, animationDelay = 0 }: ProductCardProps) {
  const { toggleItem: toggleWishlist, isInWishlist } = useWishlistStore()
  const { showSuccess } = useToastStore()
  const { currency, rates } = useCurrencyStore()

  const isWishlisted = isInWishlist(product.id)
  // Support both camelCase (HomepageProduct) and snake_case (other query shapes)
  const compareAtPrice = product.compareAtPrice ?? product.compare_at_price ?? null
  const hasDiscount = compareAtPrice && compareAtPrice > product.price

  // Helper to get image data from either nested object or denormalized fields
  const getImageData = () => {
    // Check for nested primary_image object (old format)
    if (product.primary_image) {
      return {
        url: getStorageUrl(product.primary_image.storage_path),
        alt_text: product.primary_image.alt_text,
        blurhash: product.primary_image.blurhash,
      }
    }
    // Check for denormalized fields (new format from database)
    if (product.primary_image_storage_path || product.primary_image_medium_path) {
      const path = product.primary_image_medium_path ?? product.primary_image_storage_path
      return {
        url: getStorageUrl(path),
        alt_text: product.primary_image_alt_text,
        blurhash: product.primary_image_blurhash,
      }
    }
    return null
  }

  const imageData = getImageData()

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    toggleWishlist({
      productId: product.id,
      variantId: product.id,
      productName: product.name,
      variantDescription: product.category?.name || 'Wall Art',
      price: product.price,
      oldPrice: product.compare_at_price || undefined,
      image: imageData,
    })

    showSuccess(
      isWishlisted ? 'Removed from Wishlist' : 'Added to Wishlist',
      product.name
    )
  }

  const getBadgeStyles = () => {
    switch (badge) {
      case 'new':
        return 'bg-[var(--obsidian-gold)] text-[var(--obsidian-bg)]'
      case 'sale':
        return 'bg-[var(--obsidian-red)] text-white'
      case 'hot':
        return 'bg-[var(--obsidian-surface2)] border border-[var(--obsidian-border)] text-[var(--obsidian-text-muted)]'
      case 'limited':
        return 'bg-[var(--obsidian-surface2)] border border-[var(--obsidian-border)] text-[#c94c8a]'
      default:
        return ''
    }
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="bg-[var(--obsidian-surface)] cursor-pointer relative overflow-hidden animate-fadeUp group"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Image Container */}
      <div className="aspect-square overflow-hidden relative flex items-center justify-center">
        {/* Background */}
        <div className="absolute inset-0 bg-[var(--obsidian-surface2)]" />

        {/* Glow effect on hover */}
        <div className="absolute inset-0 opacity-0 transition-opacity duration-400 group-hover:opacity-100 bg-[radial-gradient(ellipse_at_center,rgba(201,168,76,0.08)_0%,transparent_70%)]" />

        {/* Product Image */}
        <div className="relative z-[2] transition-transform duration-500 ease-out group-hover:scale-105 group-hover:-translate-y-1 w-full h-full">
          {imageData?.url ? (
            <Image
              src={imageData.url}
              alt={imageData.alt_text || product.name}
              fill
              className="object-cover"
              placeholder={imageData.blurhash ? 'blur' : undefined}
              blurDataURL={imageData.blurhash || undefined}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              🖼️
            </div>
          )}
        </div>

        {/* Badge */}
        {badge && (
          <div
            className={`absolute top-4 left-4 text-[8px] tracking-[0.15625em] uppercase px-2.5 py-1.5 font-medium z-[3] ${getBadgeStyles()}`}
          >
            {badge}
          </div>
        )}

        {/* Wishlist Heart */}
        <button
          onClick={handleToggleWishlist}
          className={`absolute top-3.5 right-3.5 z-[3] w-[34px] h-[34px] rounded-full flex items-center justify-center cursor-pointer text-[15px] transition-all duration-200 backdrop-blur-sm
            ${
              isWishlisted
                ? 'bg-[rgba(201,76,76,0.15)] border border-[var(--obsidian-red)] text-[var(--obsidian-red)]'
                : 'bg-[var(--obsidian-bg)]/80 border border-[var(--obsidian-border)] text-[var(--obsidian-text-muted)] hover:border-[var(--obsidian-red)] hover:text-[var(--obsidian-red)] hover:scale-110'
            }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Material Badge */}
        {product.category?.name && (
          <div className="absolute bottom-3.5 right-3.5 z-[3] text-[8px] tracking-[0.09375em] uppercase px-2 py-1 bg-[rgba(8,8,8,0.75)] border border-[var(--obsidian-border)] text-[var(--obsidian-text-dim)] backdrop-blur-sm">
            {product.category.name}
          </div>
        )}

      </div>

      {/* Product Info */}
      <div className="px-5 py-5 border-t border-[var(--obsidian-border)]">
        {/* Category */}
        <div className="text-[9px] tracking-[0.125em] uppercase text-[var(--obsidian-text-dim)] mb-1.5">
          {product.category?.name || 'Wall Art'}
        </div>

        {/* Name */}
        <div className="font-[family-name:var(--font-cormorant)] text-lg font-normal mb-1.5 leading-tight line-clamp-2">
          {product.name}
        </div>

        {/* Description/Material */}
        {/* <div className="text-[11px] text-[var(--obsidian-text-dim)] mb-2.5 tracking-wide">
          Laser-cut precision art
        </div> */}

        {/* Price Row */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="text-sm text-[var(--obsidian-gold)]">
            {formatPrice(product.price, currency, rates)}
          </div>
          {hasDiscount && compareAtPrice && (
            <div className="text-xs text-[var(--obsidian-text-dim)] line-through">
              {formatPrice(compareAtPrice, currency, rates)}
            </div>
          )}
        </div>

        {/* Rating - placeholder for now */}
        {/* <div className="flex gap-0.5 text-[var(--obsidian-gold)] text-[10px] mb-3">
          {'★★★★★'.split('').map((star, i) => (
            <span key={i} className={i < 4 ? '' : 'text-[var(--obsidian-text-dim)]'}>
              {star}
            </span>
          ))}
        </div> */}

      </div>
    </Link>
  )
}
