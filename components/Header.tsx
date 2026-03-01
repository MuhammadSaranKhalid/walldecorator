'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/cart.store'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const pathname = usePathname()
  const { openCart, getTotalItems } = useCartStore()
  const cartItemCount = getTotalItems()

  // Only show cart count after client-side hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/products' },
    { name: 'About', href: '/about' },
    { name: 'Track Order', href: '/track-order' },
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-sm border-b border-border bg-background/95">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="shrink-0 flex items-center">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Wall Decorator"
                width={48}
                height={48}
                className="h-10 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8 items-center">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-colors pb-1 ${
                  isActive(item.href)
                    ? 'text-brand-gold border-b-2 border-brand-gold'
                    : 'text-brand-navy hover:text-brand-gold border-b-2 border-transparent'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side - Cart & Mobile Menu Button */}
          <div className="flex items-center space-x-2">
            {/* Cart Button */}
            <button
              onClick={openCart}
              aria-label="Shopping Cart"
              className="relative p-2 text-brand-navy hover:text-brand-gold transition-colors"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              {isClient && cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-gold text-brand-navy-dark text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-brand-navy hover:text-brand-gold transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-brand-gold bg-brand-navy/5'
                      : 'text-brand-navy hover:text-brand-gold hover:bg-brand-navy/5'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
