'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useUIStore } from '@/store/ui.store'
import { useCartStore } from '@/store/cart.store'
import { useWishlistStore } from '@/store/wishlist.store'
import { Search, ShoppingCart, Heart } from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Shop', href: '/products' },
  { name: 'Collections', href: '/collections' },
  { name: 'Custom Order', href: '/custom-order' },
  { name: 'Track Order', href: '/track-order' },
]

export function MobileMenu() {
  const { isMobileMenuOpen, closeMobileMenu } = useUIStore()
  const { openCart } = useCartStore()
  const { openWishlist } = useWishlistStore()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')

  if (!isMobileMenuOpen) return null

  const handleLinkClick = () => {
    closeMobileMenu()
  }

  const handleCartClick = () => {
    closeMobileMenu()
    openCart()
  }

  const handleWishlistClick = () => {
    closeMobileMenu()
    openWishlist()
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-[var(--obsidian-bg)] z-[99] flex flex-col justify-center items-center transition-transform duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* Logo */}
        <Link href="/" onClick={handleLinkClick} className="flex items-center gap-2.5 mb-10">
          <Image
            src="/logo.png"
            alt="Wall Decorator"
            width={44}
            height={44}
            className="h-11 w-auto"
          />
          <div className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold tracking-[0.2em] text-[var(--obsidian-gold)] uppercase leading-none">
            Wall Decorator
          </div>
        </Link>

        {/* Eyebrow */}
        <div className="text-[9px] tracking-[0.1875em] uppercase text-[var(--obsidian-text-dim)] mb-7">
          Navigation
        </div>

        {/* Links */}
        <div className="flex flex-col items-center w-full">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleLinkClick}
              className={`font-[family-name:var(--font-cormorant)] text-[44px] font-light text-center py-3.5 w-full border-b border-[var(--obsidian-border)] transition-colors duration-200 cursor-pointer ${
                pathname === item.href
                  ? 'text-[var(--obsidian-gold)]'
                  : 'text-[var(--obsidian-text-muted)] hover:text-[var(--obsidian-gold)]'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Mobile Search */}
        <div className="mt-9 flex items-center gap-2.5 bg-[var(--obsidian-surface)] border border-[var(--obsidian-border)] px-5 py-3 w-[280px]">
          <Search className="w-4 h-4 text-[var(--obsidian-text-dim)]" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-[var(--obsidian-text)] font-[family-name:var(--font-dm-sans)] text-[13px] w-full placeholder:text-[var(--obsidian-text-dim)]"
          />
        </div>

        {/* Mobile Buttons */}
        <div className="flex gap-3 mt-9">
          <button
            onClick={handleWishlistClick}
            className="bg-transparent border border-[var(--obsidian-border)] text-[var(--obsidian-text)] px-3.5 py-2 cursor-pointer font-[family-name:var(--font-dm-sans)] text-xs tracking-wide transition-all duration-250 hover:border-[var(--obsidian-gold)] hover:text-[var(--obsidian-gold)]"
          >
            <Heart className="w-4 h-4" />
          </button>
          <button
            onClick={handleCartClick}
            className="bg-transparent border border-[var(--obsidian-border)] text-[var(--obsidian-text)] px-3.5 py-2 cursor-pointer font-[family-name:var(--font-dm-sans)] text-xs tracking-wide transition-all duration-250 hover:border-[var(--obsidian-gold)] hover:text-[var(--obsidian-gold)]"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  )
}
