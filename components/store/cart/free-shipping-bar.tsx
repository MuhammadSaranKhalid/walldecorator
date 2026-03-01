import { formatPrice } from '@/lib/utils'

type FreeShippingBarProps = {
  currentAmount: number
  threshold: number
}

export function FreeShippingBar({ currentAmount, threshold }: FreeShippingBarProps) {
  const remaining = threshold - currentAmount
  const percentage = Math.min((currentAmount / threshold) * 100, 100)
  const qualified = currentAmount >= threshold

  return (
    <div className="space-y-2">
      {/* Progress Bar */}
      <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            qualified ? 'bg-green-500' : 'bg-black'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Message */}
      <p className="text-sm text-center">
        {qualified ? (
          <span className="text-green-600 font-medium">
            You qualify for free shipping!
          </span>
        ) : (
          <span className="text-gray-600">
            Add <span className="font-semibold">{formatPrice(remaining)}</span> more to
            get free shipping
          </span>
        )}
      </p>
    </div>
  )
}
