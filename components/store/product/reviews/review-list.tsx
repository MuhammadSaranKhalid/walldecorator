import { ReviewCard } from './review-card'
import type { Review } from '@/types/products'

type ReviewListProps = {
  reviews: Review[]
}

export function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return null
  }

  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-4">Customer Reviews</h3>
      <div className="space-y-1">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  )
}
