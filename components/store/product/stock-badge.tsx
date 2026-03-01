import type { ProductInventory } from '@/types/products'

type StockBadgeProps = {
  inventory: ProductInventory | null
}

export function StockBadge({ inventory }: StockBadgeProps) {
  const qty = inventory?.quantity_available ?? 0

  if (qty === 0) {
    return <span className="text-red-600 text-sm font-medium">Out of Stock</span>
  }
  if (qty <= 5) {
    return (
      <span className="text-orange-600 text-sm font-medium">Only {qty} left in stock</span>
    )
  }
  return <span className="text-green-600 text-sm font-medium">In Stock</span>
}
