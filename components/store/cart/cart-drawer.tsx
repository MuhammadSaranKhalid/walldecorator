'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { useCartStore } from '@/store/cart.store'
import { CartItem } from './cart-item'
import { FreeShippingBar } from './free-shipping-bar'
import { formatPrice } from '@/lib/utils'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

const FREE_SHIPPING_THRESHOLD = 5000 // Rs 5,000

export function CartDrawer() {
  const [isMounted, setIsMounted] = useState(false)

  // Prevent hydration mismatch by only accessing store after mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Don't render anything until mounted
  if (!isMounted) {
    return null
  }

  return <CartDrawerContent />
}

function CartDrawerContent() {
  const { isOpen, closeCart, items, getTotalItems, getTotalPrice } = useCartStore()

  const total = getTotalPrice()
  const itemCount = getTotalItems()

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && closeCart()} direction="right">
      <DrawerContent className="h-full w-full sm:max-w-md">
        {/* Header */}
        <DrawerHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg">
              Your Cart {itemCount > 0 && `(${itemCount})`}
            </DrawerTitle>
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        {items.length === 0 ? (
          // Empty state
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
            <div className="text-6xl">🛒</div>
            <p className="text-center text-gray-500">
              Your cart is empty. Start shopping!
            </p>
            <DrawerClose asChild>
              <Button size="lg" className="rounded-xl">
                Continue Shopping
              </Button>
            </DrawerClose>
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Free shipping progress bar */}
            <div className="px-6 pt-4">
              <FreeShippingBar currentAmount={total} threshold={FREE_SHIPPING_THRESHOLD} />
            </div>

            {/* Cart Items — scrollable */}
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <CartItem key={item.variantId} item={item} />
                ))}
              </div>
            </ScrollArea>

            {/* Footer — sticky at bottom */}
            <div className="border-t px-6 py-6 space-y-4">
              {/* Order summary */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600">
                    {total >= FREE_SHIPPING_THRESHOLD
                      ? 'Free'
                      : 'Calculated at checkout'}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-2 border-t">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* CTAs */}
              <DrawerClose asChild>
                <Link href="/checkout">
                  <Button size="lg" className="w-full rounded-xl">
                    Checkout
                  </Button>
                </Link>
              </DrawerClose>

              <DrawerClose asChild>
                <Button variant="ghost" className="w-full">
                  Continue Shopping
                </Button>
              </DrawerClose>

              {/* Trust badge */}
              <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
                🔒 Secure checkout
              </p>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
