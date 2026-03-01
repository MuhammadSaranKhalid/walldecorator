import { format } from 'date-fns'
import type { Review } from '@/types/products'

type ReviewCardProps = {
  review: Review
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="border-b border-gray-200 py-6 last:border-0">
      {/* Rating and Date */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={`text-sm ${
                i < review.rating ? 'text-yellow-400' : 'text-gray-300'
              }`}
            >
              ★
            </span>
          ))}
        </div>
        <time className="text-sm text-gray-500">
          {format(new Date(review.created_at), 'MMM d, yyyy')}
        </time>
      </div>

      {/* Title */}
      {review.title && (
        <h4 className="font-semibold text-gray-900 mb-1">{review.title}</h4>
      )}

      {/* Body */}
      {review.body && <p className="text-gray-600 text-sm">{review.body}</p>}

      {/* Reviewer */}
      <p className="text-sm text-gray-500 mt-3">
        {review.profile?.display_name || 'Anonymous'}
      </p>
    </div>
  )
}
