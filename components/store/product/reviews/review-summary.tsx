import type { ReviewSummary as ReviewSummaryType } from '@/types/products'

type ReviewSummaryProps = {
  summary: ReviewSummaryType
}

export function ReviewSummary({ summary }: ReviewSummaryProps) {
  const { totalCount, averageRating, distribution } = summary

  if (totalCount === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No reviews yet. Be the first to review this product!</p>
      </div>
    )
  }

  return (
    <div className="border rounded-xl p-6 bg-gray-50">
      <div className="flex items-center gap-6">
        {/* Average Rating */}
        <div className="text-center">
          <div className="text-5xl font-bold">{averageRating.toFixed(1)}</div>
          <div className="flex items-center gap-1 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`text-lg ${
                  i < Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                ★
              </span>
            ))}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Based on {totalCount} {totalCount === 1 ? 'review' : 'reviews'}
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="flex-1 space-y-2">
          {distribution.map(({ star, count }) => {
            const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0
            return (
              <div key={star} className="flex items-center gap-3">
                <span className="text-sm font-medium w-12">{star} star</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-yellow-400 h-full rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-8">{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
