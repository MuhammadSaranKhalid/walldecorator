'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useCartStore } from '@/store/cart.store'
import { useCurrencyStore } from '@/store/currency.store'
import { formatPrice } from '@/lib/currency'
import { X, ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'

const FREE_SHIPPING_THRESHOLD = 5000

export function ObsidianCartDrawer() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  return <CartDrawerContent />
}

function CartDrawerContent() {
  const { t } = useTranslation('common')
  const { isOpen, closeCart, items, getTotalItems, getTotalPrice, updateQuantity, removeItem } =
    useCartStore()
  const { currency, rates } = useCurrencyStore()
  const router = useRouter()

  const total = getTotalPrice()
  const itemCount = getTotalItems()
  const shippingCost = total >= FREE_SHIPPING_THRESHOLD ? 0 : 250

  const handleCheckout = () => {
    closeCart()
    router.push('/checkout')
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 dark:bg-black/70 z-[200] transition-opacity duration-300 backdrop-blur-sm ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeCart}
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
              {t('cart.title')}
            </span>
            <span className="text-[var(--obsidian-text-muted)] text-base ml-2">{itemCount}</span>
          </div>
          <button
            onClick={closeCart}
            aria-label={t('cart.close')}
            className="bg-transparent border border-[var(--obsidian-border)] text-[var(--obsidian-text-muted)] w-9 h-9 cursor-pointer text-lg flex items-center justify-center transition-all duration-200 hover:border-[var(--obsidian-text)] hover:text-[var(--obsidian-text)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {items.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center flex-1 text-[var(--obsidian-text-muted)] gap-3">
            <ShoppingCart className="w-12 h-12 opacity-30" />
            <p className="text-xs tracking-wide uppercase">{t('cart.empty')}</p>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 sm:py-6 obsidian-scrollbar">
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
                      <div className="text-[var(--obsidian-gold)] text-[13px] mb-2.5">
                        {formatPrice(item.price, currency, rates)}
                      </div>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="bg-[var(--obsidian-surface2)] border border-[var(--obsidian-border)] text-[var(--obsidian-text)] w-8 h-8 cursor-pointer text-base flex items-center justify-center transition-all duration-200 hover:border-[var(--obsidian-gold)] hover:text-[var(--obsidian-gold)]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-[13px] min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="bg-[var(--obsidian-surface2)] border border-[var(--obsidian-border)] text-[var(--obsidian-text)] w-8 h-8 cursor-pointer text-base flex items-center justify-center transition-all duration-200 hover:border-[var(--obsidian-gold)] hover:text-[var(--obsidian-gold)]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeItem(item.variantId)}
                      className="bg-transparent border-none text-[var(--obsidian-text-dim)] cursor-pointer text-lg p-1 transition-colors duration-200 self-start hover:text-[var(--obsidian-red)]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 sm:px-8 py-5 sm:py-6 border-t border-[var(--obsidian-border)]">
              {/* Summary */}
              <div className="mb-5">
                <div className="flex justify-between text-xs text-[var(--obsidian-text-muted)] py-1.5 tracking-wide">
                  <span>{t('cart.subtotal')}</span>
                  <span>{formatPrice(total, currency, rates)}</span>
                </div>
                <div className="flex justify-between text-xs text-[var(--obsidian-text-muted)] py-1.5 tracking-wide">
                  <span>{t('cart.shipping')}</span>
                  <span className={shippingCost === 0 ? 'text-[var(--obsidian-gold)]' : ''}>
                    {shippingCost === 0 ? t('cart.shippingFree') : formatPrice(shippingCost, currency, rates)}
                  </span>
                </div>
                <div className="flex justify-between font-[family-name:var(--font-cormorant)] text-xl pt-3.5 border-t border-[var(--obsidian-border)] mt-2">
                  <span>{t('cart.total')}</span>
                  <span className="text-[var(--obsidian-gold)]">
                    {formatPrice(total + shippingCost, currency, rates)}
                  </span>
                </div>
              </div>

              {/* Checkout button */}
              <button
                onClick={handleCheckout}
                className="w-full bg-[var(--obsidian-gold)] text-[var(--obsidian-bg)] border-none px-6 py-4.5 cursor-pointer font-[family-name:var(--font-dm-sans)] text-[11px] tracking-[0.1875em] uppercase font-medium transition-all duration-250 hover:bg-[var(--obsidian-gold-light)]"
              >
                {t('cart.checkout')}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
