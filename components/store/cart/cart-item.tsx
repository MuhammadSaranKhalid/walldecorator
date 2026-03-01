'use client'

import Image from 'next/image'
import { X } from 'lucide-react'
import { useCartStore } from '@/store/cart.store'
import { getStorageUrl } from '@/lib/supabase/storage'
import { formatPrice } from '@/lib/utils'
import type { CartItem as CartItemType } from '@/store/cart.store'

type CartItemProps = {
  item: CartItemType
}

export function CartItem({ item }: CartItemProps) {
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const removeItem = useCartStore((state) => state.removeItem)

  return (
    <div className="flex gap-4">
      {/* Product Image */}
      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
        {item.image ? (
          <Image
            src={getStorageUrl(item.image.storage_path)}
            alt={item.image.alt_text || item.productName}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-xs">
            No image
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm text-gray-900 truncate">
          {item.productName}
        </h3>
        {item.variantDescription && (
          <p className="text-xs text-gray-500 mt-0.5">{item.variantDescription}</p>
        )}

        {/* Quantity Controls */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center border rounded">
            <button
              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
              className="px-2 py-1 text-gray-600 hover:bg-gray-50 text-sm"
            >
              −
            </button>
            <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
              className="px-2 py-1 text-gray-600 hover:bg-gray-50 text-sm"
            >
              +
            </button>
          </div>

          <span className="text-sm font-semibold">
            {formatPrice(item.price * item.quantity)}
          </span>
        </div>
      </div>

      {/* Remove Button */}
      <button
        onClick={() => removeItem(item.variantId)}
        className="p-1 hover:bg-gray-100 rounded-full transition-colors shrink-0"
        aria-label="Remove item"
      >
        <X size={16} className="text-gray-400" />
      </button>
    </div>
  )
}
