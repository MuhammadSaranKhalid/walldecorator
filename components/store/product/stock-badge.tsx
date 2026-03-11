type StockBadgeProps = {
  stock: number
}

export function StockBadge({ stock }: StockBadgeProps) {
  if (stock === 0) {
    return <span className="text-red-600 text-sm font-medium">Out of Stock</span>
  }
  if (stock <= 5) {
    return (
      <span className="text-orange-600 text-sm font-medium">Only {stock} left in stock</span>
    )
  }
  return <span className="text-green-600 text-sm font-medium">In Stock</span>
}
