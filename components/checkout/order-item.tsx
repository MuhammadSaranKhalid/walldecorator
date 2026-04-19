import Image from 'next/image'
import type { CartItem } from '@/store/cart.store'
import { formatPrice } from '@/lib/currency'
import type { CurrencyCode } from '@/lib/currency'
import type { RatesMap } from '@/lib/rates'
import { blurhashToDataURL } from '@/lib/blurhash'

type OrderItemProps = {
  item: CartItem
  currency: CurrencyCode
  rates: RatesMap
}

export function OrderItem({ item, currency, rates }: OrderItemProps) {
  const blurUrl = item.image?.blurhash ? blurhashToDataURL(item.image.blurhash) : undefined

  return (
    <div className="flex gap-3 py-3">
      <div className="relative h-16 w-16 shrink-0">
        <div className="h-full w-full overflow-hidden border border-[var(--obsidian-border)] bg-[var(--obsidian-surface)]">
          {item.image ? (
            <Image
              src={item.image.url}
              alt={item.image.alt_text || item.productName}
              fill
              className="object-cover"
              sizes="64px"
              quality={75}
              {...(blurUrl ? { placeholder: 'blur', blurDataURL: blurUrl } : {})}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[var(--obsidian-surface2)] text-[var(--obsidian-text-muted)] text-xs">
              No image
            </div>
          )}
        </div>
        <div className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--obsidian-gold)] text-xs font-medium text-[var(--obsidian-bg)] border-2 border-[var(--obsidian-bg)] shadow-sm z-10">
          {item.quantity}
        </div>
      </div>

      <div className="flex flex-1 items-start justify-between gap-3 min-w-0">
        <div className="flex-1 min-w-0">
          <h3 className="font-normal text-sm text-[var(--obsidian-text)] leading-tight">{item.productName}</h3>
          <p className="text-xs text-[var(--obsidian-text-muted)] mt-1">{item.variantDescription}</p>
        </div>
        <p className="text-sm font-medium text-[var(--obsidian-text)] shrink-0">
          {formatPrice(item.price * item.quantity, currency, rates)}
        </p>
      </div>
    </div>
  )
}
