'use client'

import { useMemo, useState } from 'react'
import { Tag, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react'
import type { CartItem } from '@/store/cart.store'
import { OrderItem } from './order-item'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '@/lib/constants'

type OrderSummaryProps = {
  items: CartItem[]
}

export function OrderSummary({ items }: OrderSummaryProps) {
  const [discountCode, setDiscountCode] = useState('')
  const [showDiscountField, setShowDiscountField] = useState(false)
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false)

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  )

  const shippingCost = useMemo(
    () => (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST),
    [subtotal]
  )

  const total = useMemo(
    () => subtotal + shippingCost,
    [subtotal, shippingCost]
  )

  const handleApplyDiscount = () => {
    // Placeholder for discount logic
    console.log('Applying discount:', discountCode)
  }

  return (
    <div className="bg-white lg:rounded-lg lg:border border-gray-200 overflow-hidden">
      {/* Mobile Toggle Button - Only visible on mobile */}
      <button
        type="button"
        onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
        className="lg:hidden w-full flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-5 w-5 text-brand-navy" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {isSummaryExpanded ? 'Hide' : 'Show'} order summary
            </span>
            {isSummaryExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-600" />
            )}
          </div>
        </div>
        <div className="text-lg font-bold text-brand-navy">
          {formatPrice(total)}
        </div>
      </button>

      {/* Order Summary Content - Hidden on mobile unless expanded */}
      <div className={`${isSummaryExpanded ? 'block' : 'hidden'} lg:block`}>
        {/* Order items */}
        <div className="p-6 bg-gray-50/30 lg:bg-gray-50/30">
          <h2 className="hidden lg:block text-lg font-semibold mb-4 text-gray-900">Order Summary</h2>
          <div className="max-h-[400px] overflow-y-auto -mx-2 px-2">
            {items.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Your cart is empty</p>
            ) : (
              <div className="space-y-0">
                {items.map((item) => (
                  <OrderItem key={item.variantId} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Discount code */}
        <div className="p-6 space-y-3">
          {!showDiscountField ? (
            <button
              type="button"
              onClick={() => setShowDiscountField(true)}
              className="flex items-center gap-2 text-sm text-brand-navy hover:text-brand-gold transition-colors"
            >
              <Tag className="h-4 w-4" />
              <span>Add discount code</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Discount code"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleApplyDiscount}
                disabled={!discountCode}
              >
                Apply
              </Button>
            </div>
          )}

          <Separator />

          {/* Price breakdown */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium">
                {shippingCost === 0 ? (
                  <span className="text-green-600 font-semibold">Free</span>
                ) : (
                  formatPrice(shippingCost)
                )}
              </span>
            </div>

            {subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD && (
              <div className="px-3 py-2 bg-blue-50 rounded-md">
                <p className="text-xs text-blue-800">
                  Add {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping
                </p>
              </div>
            )}

            <Separator />

            <div className="flex justify-between items-center pt-2">
              <span className="text-base font-semibold">Total</span>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">PKR</div>
                <div className="text-2xl font-bold text-brand-navy">
                  {formatPrice(total)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
