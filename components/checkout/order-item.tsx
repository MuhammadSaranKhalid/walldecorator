import { getStorageUrl } from '@/lib/supabase/storage'
import Image from 'next/image'
import type { CartItem } from '@/store/cart.store'
import { formatPrice } from '@/lib/utils'
import { blurhashToDataURL } from '@/lib/blurhash'

type OrderItemProps = {
  item: CartItem
}

export function OrderItem({ item }: OrderItemProps) {
  return (
    <div className="flex gap-3 py-3">
      <div className="relative h-16 w-16 shrink-0">
        <div className="h-full w-full overflow-hidden rounded-md border border-gray-300 bg-white">
          {item.image ? (
            <Image
              src={getStorageUrl(item.image.storage_path)}
              alt={item.image.alt_text || item.productName}
              fill
              className="object-cover"
              sizes="64px"
              quality={75}
              placeholder="blur"
              blurDataURL={blurhashToDataURL(item.image.blurhash)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-50 text-gray-400 text-xs">
              No image
            </div>
          )}
        </div>
        <div className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-600 text-xs font-medium text-white border-2 border-white shadow-sm z-10">
          {item.quantity}
        </div>
      </div>

      <div className="flex flex-1 items-start justify-between gap-3 min-w-0">
        <div className="flex-1 min-w-0">
          <h3 className="font-normal text-sm text-gray-900 leading-tight">{item.productName}</h3>
          <p className="text-xs text-gray-500 mt-1">{item.variantDescription}</p>
        </div>
        <p className="text-sm font-medium text-gray-900 shrink-0">
          {formatPrice(item.price * item.quantity)}
        </p>
      </div>
    </div>
  )
}
