'use client'

import { useWishlistStore } from '@/store/wishlist.store'
import { useCartStore } from '@/store/cart.store'
import { useToastStore } from '@/store/toast.store'
import { useCurrencyStore } from '@/store/currency.store'
import { formatPrice } from '@/lib/currency'
import { X, Heart, ShoppingCart } from 'lucide-react'
import Image from 'next/image'

export function WishlistDrawer() {
  const { items, isOpen, closeWishlist, removeItem } = useWishlistStore()
  const { addItem: addToCart } = useCartStore()
  const { showSuccess } = useToastStore()
  const { currency, rates } = useCurrencyStore()

  const handleMoveToCart = (item: typeof items[0]) => {
    addToCart({
      variantId: item.variantId,
      productName: item.productName,
      variantDescription: item.variantDescription,
      sku: item.variantId,
      price: item.price,
      quantity: 1,
      image: item.image,
    })
    removeItem(item.variantId)
    showSuccess('Added to Cart', `${item.productName} moved to cart`)
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 dark:bg-black/70 z-[200] transition-opacity duration-300 backdrop-blur-sm ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeWishlist}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-[420px] max-w-full bg-[var(--obsidian-surface)] border-l border-[var(--obsidian-border)] z-[201] flex flex-col transition-transform duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-5 sm:px-8 py-5 sm:py-7 border-b border-[var(--obsidian-border)] flex items-center justify-between">
          <div>
            <span className="font-[family-name:var(--font-cormorant)] text-[26px] font-light">
              Wishlist
            </span>
            <span className="text-[var(--obsidian-text-muted)] text-base ml-2">
              {items.length}
            </span>
          </div>
          <button
            onClick={closeWishlist}
            className="bg-transparent border border-[var(--obsidian-border)] text-[var(--obsidian-text-muted)] w-9 h-9 cursor-pointer text-lg flex items-center justify-center transition-all duration-200 hover:border-[var(--obsidian-text)] hover:text-[var(--obsidian-text)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 sm:py-6 obsidian-scrollbar">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--obsidian-text-muted)] gap-3">
              <Heart className="w-12 h-12 opacity-30" />
              <p className="text-xs tracking-wide uppercase">Your wishlist is empty</p>
            </div>
          ) : (
            <div className="space-y-0">
              {items.map((item) => (
                <div
                  key={item.variantId}
                  className="flex gap-4 py-4.5 border-b border-[var(--obsidian-border)] animate-slideIn"
                >
                  {/* Image */}
                  <div className="w-[72px] h-[72px] bg-[var(--obsidian-surface2)] flex items-center justify-center flex-shrink-0 relative">
                    {item.image?.url ? (
                      <Image
                        src={item.image.url}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="text-[28px]">🖼️</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="font-[family-name:var(--font-cormorant)] text-base mb-0.5">
                      {item.productName}
                    </div>
                    <div className="text-[10px] text-[var(--obsidian-text-dim)] tracking-wide mb-1">
                      {item.variantDescription}
                    </div>
                    <div className="text-[var(--obsidian-gold)] text-[13px] mb-2.5 flex items-center gap-2">
                      <span>{formatPrice(item.price, currency, rates)}</span>
                      {item.oldPrice && (
                        <span className="text-[var(--obsidian-text-dim)] line-through text-xs">
                          {formatPrice(item.oldPrice, currency, rates)}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMoveToCart(item)}
                        className="bg-[var(--obsidian-gold)] text-[var(--obsidian-bg)] border-none px-3.5 py-2 cursor-pointer font-[family-name:var(--font-dm-sans)] text-[9px] tracking-[0.125em] uppercase font-medium transition-colors duration-200 hover:bg-[var(--obsidian-gold-light)]"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="bg-transparent border border-[var(--obsidian-border)] text-[var(--obsidian-text-muted)] px-2.5 py-2 cursor-pointer text-sm transition-all duration-200 hover:border-[var(--obsidian-red)] hover:text-[var(--obsidian-red)]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
