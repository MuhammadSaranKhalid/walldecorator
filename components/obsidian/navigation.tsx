'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/cart.store'
import { useWishlistStore } from '@/store/wishlist.store'
import { useUIStore } from '@/store/ui.store'
import { Search, ShoppingCart, Heart, Menu } from 'lucide-react'

const navigation = [
  { name: 'Shop', href: '/products' },
  { name: 'Collections', href: '/collections' },
  { name: 'Custom', href: '/custom-order' },
  { name: 'Track', href: '/track-order' },
]

export function ObsidianNavigation() {
  const [isClient, setIsClient] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname()

  const { openCart, getTotalItems } = useCartStore()
  const wishlistItems = useWishlistStore((state) => state.items)
  const { openWishlist } = useWishlistStore()
  const { toggleMobileMenu } = useUIStore()

  const cartItemCount = getTotalItems()
  const wishlistCount = wishlistItems.length

  useEffect(() => {
    setIsClient(true)
  }, [])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-12 py-5 obsidian-glass border-b border-[var(--obsidian-border)]">
      {/* Logo */}
      <Link href="/" className="flex flex-col cursor-pointer group">
        <div className="font-[family-name:var(--font-cormorant)] text-xl font-semibold tracking-[0.375em] text-[var(--obsidian-gold)] uppercase leading-none transition-colors group-hover:text-[var(--obsidian-gold-light)]">
          OBSIDIAN
        </div>
        <div className="text-[8px] tracking-[0.1875em] uppercase text-[var(--obsidian-text-dim)] mt-0.5">
          Wall Art & Decor
        </div>
      </Link>

      {/* Desktop Navigation Links */}
      <div className="hidden md:flex gap-9">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`text-[11px] tracking-[0.15625em] uppercase transition-colors duration-250 ${
              isActive(item.href)
                ? 'text-[var(--obsidian-text)]'
                : 'text-[var(--obsidian-text-muted)] hover:text-[var(--obsidian-text)]'
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>

      {/* Right side - Search, Wishlist, Cart, Mobile Menu */}
      <div className="flex items-center gap-3">
        {/* Search Input - Desktop only */}
        <div className="hidden md:flex items-center gap-2.5 bg-[var(--obsidian-surface)] border border-[var(--obsidian-border)] rounded-sm px-3.5 py-2">
          <Search className="w-3.5 h-3.5 text-[var(--obsidian-text-dim)]" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-[var(--obsidian-text)] font-[family-name:var(--font-dm-sans)] text-xs tracking-wide w-44 placeholder:text-[var(--obsidian-text-dim)]"
          />
        </div>

        {/* Wishlist Button */}
        <button
          onClick={openWishlist}
          className="relative bg-transparent border border-[var(--obsidian-border)] text-[var(--obsidian-text)] px-3.5 py-2 cursor-pointer font-[family-name:var(--font-dm-sans)] text-xs tracking-wide transition-all duration-250 whitespace-nowrap hover:border-[var(--obsidian-gold)] hover:text-[var(--obsidian-gold)]"
          aria-label="Wishlist"
        >
          <Heart className="w-4 h-4" />
          {isClient && wishlistCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-medium flex items-center justify-center bg-[var(--obsidian-gold)] text-[var(--obsidian-bg)]">
              {wishlistCount}
            </span>
          )}
        </button>

        {/* Cart Button */}
        <button
          onClick={openCart}
          className="relative bg-transparent border border-[var(--obsidian-border)] text-[var(--obsidian-text)] px-3.5 py-2 cursor-pointer font-[family-name:var(--font-dm-sans)] text-xs tracking-wide transition-all duration-250 whitespace-nowrap hover:border-[var(--obsidian-gold)] hover:text-[var(--obsidian-gold)]"
          aria-label="Shopping Cart"
        >
          <ShoppingCart className="w-4 h-4" />
          {isClient && cartItemCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-medium flex items-center justify-center bg-[var(--obsidian-gold)] text-[var(--obsidian-bg)]">
              {cartItemCount > 99 ? '99' : cartItemCount}
            </span>
          )}
        </button>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden flex flex-col gap-1.5 bg-transparent border-none cursor-pointer p-1.5"
          aria-label="Toggle menu"
        >
          <span className="block w-5.5 h-px bg-[var(--obsidian-text)] transition-all duration-300" />
          <span className="block w-5.5 h-px bg-[var(--obsidian-text)] transition-all duration-300" />
          <span className="block w-5.5 h-px bg-[var(--obsidian-text)] transition-all duration-300" />
        </button>
      </div>
    </nav>
  )
}
