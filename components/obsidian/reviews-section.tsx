'use client'

import { useState } from 'react'

interface Review {
  id: string
  author: string
  initials: string
  date: string
  rating: number
  title: string
  text: string
  verified: boolean
  material?: string
  location?: string
  helpful: number
  isHelpful?: boolean
}

interface ReviewsSectionProps {
  productId: string
  reviews?: Review[]
  averageRating?: number
  totalReviews?: number
  ratingDistribution?: { stars: number; count: number; percentage: number }[]
}

export function ReviewsSection({
  productId,
  reviews = [],
  averageRating = 0,
  totalReviews = 0,
  ratingDistribution = [],
}: ReviewsSectionProps) {
  const [filterRating, setFilterRating] = useState<'all' | number>('all')
  const [sortMode, setSortMode] = useState('recent')
  const [reviewFormOpen, setReviewFormOpen] = useState(false)
  const [selectedRating, setSelectedRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set())
  const [helpfulReviews, setHelpfulReviews] = useState<Set<string>>(new Set())

  const ratingLabels = [
    '',
    'Poor - Not Recommended',
    'Fair - Below Expectations',
    'Good - Met Expectations',
    'Very Good - Exceeded Expectations',
    'Excellent - Absolutely Love It!',
  ]

  const toggleExpanded = (reviewId: string) => {
    const newExpanded = new Set(expandedReviews)
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId)
    } else {
      newExpanded.add(reviewId)
    }
    setExpandedReviews(newExpanded)
  }

  const toggleHelpful = (reviewId: string) => {
    const newHelpful = new Set(helpfulReviews)
    if (newHelpful.has(reviewId)) {
      newHelpful.delete(reviewId)
    } else {
      newHelpful.add(reviewId)
    }
    setHelpfulReviews(newHelpful)
  }

  // Placeholder data if none provided
  const displayReviews: Review[] = reviews.length
    ? reviews
    : [
        {
          id: '1',
          author: 'James Harrison',
          initials: 'JH',
          date: 'Dec 15, 2025',
          rating: 5,
          title: 'Absolutely Stunning Piece',
          text: 'I purchased this for my living room and it has become the centerpiece of the entire space. The craftsmanship is impeccable — you can feel the quality in every laser-cut detail. The powder-coated finish is smooth and premium. Highly recommend for anyone looking to elevate their wall decor game.',
          verified: true,
          material: 'Powder Steel',
          location: 'Los Angeles, CA',
          helpful: 24,
        },
        {
          id: '2',
          author: 'Emma Rodriguez',
          initials: 'ER',
          date: 'Dec 10, 2025',
          rating: 5,
          title: 'Perfect Gift, Great Packaging',
          text: "Bought this as a gift for my brother who's a huge anime fan. The piece arrived beautifully packaged in a gift box — no extra wrapping needed. He absolutely loved it! The quality exceeded my expectations for the price point.",
          verified: true,
          material: 'Hardwood',
          helpful: 18,
        },
        {
          id: '3',
          author: 'Michael Chen',
          initials: 'MC',
          date: 'Dec 5, 2025',
          rating: 4,
          title: 'Great Quality, Slightly Darker Than Expected',
          text: 'The art piece is fantastic overall. My only note is that the finish appears slightly darker in person than in the photos. Still love it though, and the mounting hardware made installation super easy.',
          verified: true,
          material: 'Powder Steel',
          location: 'Seattle, WA',
          helpful: 12,
        },
      ]

  const displayAvgRating = averageRating || 4.8
  const displayTotalReviews = totalReviews || displayReviews.length
  const displayDistribution =
    ratingDistribution.length > 0
      ? ratingDistribution
      : [
          { stars: 5, count: 85, percentage: 75 },
          { stars: 4, count: 22, percentage: 19 },
          { stars: 3, count: 5, percentage: 4 },
          { stars: 2, count: 2, percentage: 2 },
          { stars: 1, count: 0, percentage: 0 },
        ]

  return (
    <div className="px-8 sm:px-14 py-18 border-t border-[var(--obsidian-border)] bg-[var(--obsidian-bg)]">
      {/* Header */}
      <div className="flex items-end justify-between mb-13 flex-wrap gap-5">
        <div className="font-[family-name:var(--font-cormorant)] text-[38px] font-light leading-none">
          Customer <em className="italic text-[var(--obsidian-gold)]">Reviews</em>
        </div>
        <div className="text-[11px] text-[var(--obsidian-text-muted)] tracking-[1px]">
          {displayTotalReviews} verified reviews
        </div>
      </div>

      {/* Rating Summary */}
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-12 pb-13 border-b border-[var(--obsidian-border)] mb-12 items-center">
        {/* Score */}
        <div className="text-center">
          <div className="font-[family-name:var(--font-cormorant)] text-[80px] font-light leading-none text-[var(--obsidian-gold)]">
            {displayAvgRating.toFixed(1)}
          </div>
          <div className="text-[var(--obsidian-gold)] text-[18px] tracking-[3px] my-2">
            {'★'.repeat(Math.floor(displayAvgRating))}
            {'☆'.repeat(5 - Math.floor(displayAvgRating))}
          </div>
          <div className="text-[11px] text-[var(--obsidian-text-muted)] tracking-[1px]">
            Based on {displayTotalReviews} reviews
          </div>
        </div>

        {/* Distribution Bars */}
        <div className="flex flex-col gap-2.5">
          {displayDistribution.map((item) => (
            <div key={item.stars} className="flex items-center gap-3">
              <div className="text-[10px] text-[var(--obsidian-text-muted)] tracking-[1px] whitespace-nowrap w-9 text-right flex-shrink-0">
                <span className="text-[var(--obsidian-gold)]">{item.stars}</span> ★
              </div>
              <div className="flex-1 h-1 bg-[var(--obsidian-border)] relative overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-[var(--obsidian-gold)] transition-[width] duration-[0.8s] cubic-bezier(0.4,0,0.2,1)"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <div className="text-[10px] text-[var(--obsidian-text-dim)] w-7 flex-shrink-0">
                {item.count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-9 flex-wrap gap-3.5">
        {/* Filter Pills */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterRating('all')}
            className={`bg-transparent border px-4 py-1.5 cursor-pointer font-[family-name:var(--font-dm-sans)] text-[9px] tracking-[2px] uppercase transition-all duration-200 ${
              filterRating === 'all'
                ? 'border-[var(--obsidian-gold)] text-[var(--obsidian-gold)] bg-[rgba(201,168,76,0.05)]'
                : 'border-[var(--obsidian-border)] text-[var(--obsidian-text-dim)] hover:border-[var(--obsidian-text-muted)] hover:text-[var(--obsidian-text-muted)]'
            }`}
          >
            All
          </button>
          {[5, 4, 3, 2, 1].map((stars) => (
            <button
              key={stars}
              onClick={() => setFilterRating(stars)}
              className={`bg-transparent border px-4 py-1.5 cursor-pointer font-[family-name:var(--font-dm-sans)] text-[9px] tracking-[2px] uppercase transition-all duration-200 ${
                filterRating === stars
                  ? 'border-[var(--obsidian-gold)] text-[var(--obsidian-gold)] bg-[rgba(201,168,76,0.05)]'
                  : 'border-[var(--obsidian-border)] text-[var(--obsidian-text-dim)] hover:border-[var(--obsidian-text-muted)] hover:text-[var(--obsidian-text-muted)]'
              }`}
            >
              {stars} ★
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value)}
          className="bg-[var(--obsidian-surface)] border border-[var(--obsidian-border)] text-[var(--obsidian-text-muted)] px-3.5 py-[7px] font-[family-name:var(--font-dm-sans)] text-[10px] cursor-pointer outline-none tracking-[1px]"
        >
          <option value="recent">Most Recent</option>
          <option value="helpful">Most Helpful</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="flex flex-col gap-0">
        {displayReviews.map((review) => {
          const isExpanded = expandedReviews.has(review.id)
          const isHelpful = helpfulReviews.has(review.id)
          const needsExpansion = review.text.length > 200

          return (
            <div
              key={review.id}
              className="py-8 border-b border-[var(--obsidian-border)] last:border-b-0 animate-fadeUp"
            >
              {/* Top */}
              <div className="flex items-start justify-between mb-3.5 gap-4 flex-wrap">
                {/* Author Block */}
                <div className="flex items-center gap-3.5">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[var(--obsidian-surface2)] border border-[var(--obsidian-border)] flex items-center justify-center text-[14px] font-[family-name:var(--font-cormorant)] font-normal text-[var(--obsidian-gold)] flex-shrink-0 tracking-[1px] uppercase">
                    {review.initials}
                  </div>
                  {/* Info */}
                  <div>
                    <div className="text-[13px] font-medium tracking-[0.5px] mb-[3px]">
                      {review.author}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-[10px] text-[var(--obsidian-text-dim)]">
                        {review.date}
                      </div>
                      {review.verified && (
                        <div className="text-[8px] tracking-[1.5px] uppercase text-[#4caa6a] border border-[rgba(76,170,106,0.3)] px-[7px] py-[2px]">
                          Verified
                        </div>
                      )}
                      {review.material && (
                        <div className="text-[8px] tracking-[1.5px] uppercase text-[var(--obsidian-text-dim)] border border-[var(--obsidian-border)] px-[7px] py-[2px]">
                          {review.material}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-[3px] text-[var(--obsidian-gold)] text-[13px]">
                  {'★'.repeat(review.rating)}
                  <span className="text-[var(--obsidian-text-dim)]">
                    {'☆'.repeat(5 - review.rating)}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="mb-4.5">
                <div className="font-[family-name:var(--font-cormorant)] text-[19px] font-normal mb-2.5 leading-[1.2]">
                  {review.title}
                </div>
                <div
                  className={`text-[13px] leading-[1.9] text-[var(--obsidian-text-muted)] max-w-[680px] ${
                    !isExpanded && needsExpansion
                      ? 'line-clamp-3'
                      : ''
                  }`}
                >
                  {review.text}
                </div>
                {needsExpansion && (
                  <button
                    onClick={() => toggleExpanded(review.id)}
                    className="bg-transparent border-none text-[var(--obsidian-gold)] text-[11px] tracking-[1px] cursor-pointer p-0 mt-1.5 inline-block transition-opacity duration-200 hover:opacity-70 font-[family-name:var(--font-dm-sans)]"
                  >
                    {isExpanded ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2 text-[10px] text-[var(--obsidian-text-dim)] tracking-[0.5px]">
                  Helpful?
                  <button
                    onClick={() => toggleHelpful(review.id)}
                    className={`bg-transparent border px-3 py-[5px] cursor-pointer font-[family-name:var(--font-dm-sans)] text-[9px] tracking-[1.5px] uppercase transition-all duration-200 flex items-center gap-[5px] ${
                      isHelpful
                        ? 'border-[var(--obsidian-gold)] text-[var(--obsidian-gold)] bg-[rgba(201,168,76,0.05)]'
                        : 'border-[var(--obsidian-border)] text-[var(--obsidian-text-dim)] hover:border-[var(--obsidian-gold)] hover:text-[var(--obsidian-gold)]'
                    }`}
                  >
                    👍 {review.helpful + (isHelpful ? 1 : 0)}
                  </button>
                </div>
                <button className="bg-transparent border-none text-[var(--obsidian-text-dim)] text-[9px] tracking-[1px] uppercase cursor-pointer transition-colors duration-200 p-0 ml-auto hover:text-[var(--obsidian-text-muted)] font-[family-name:var(--font-dm-sans)]">
                  Report
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Load More */}
      {displayReviews.length >= 3 && (
        <div className="text-center pt-9">
          <button className="bg-transparent border border-[var(--obsidian-border)] text-[var(--obsidian-text-muted)] px-10 py-[13px] cursor-pointer font-[family-name:var(--font-dm-sans)] text-[10px] tracking-[2.5px] uppercase transition-all duration-300 hover:border-[var(--obsidian-gold)] hover:text-[var(--obsidian-gold)]">
            Load More Reviews
          </button>
        </div>
      )}

      {/* Write Review Toggle */}
      <div className="mt-12">
        <div
          onClick={() => setReviewFormOpen(!reviewFormOpen)}
          className={`flex items-center justify-between px-7 py-6 bg-[var(--obsidian-surface)] border border-[var(--obsidian-border)] cursor-pointer transition-[border-color] duration-250 hover:border-[var(--obsidian-gold)] ${
            reviewFormOpen ? 'mb-0' : 'mb-0'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 bg-[rgba(201,168,76,0.08)] border border-[rgba(201,168,76,0.2)] flex items-center justify-center text-[14px] text-[var(--obsidian-gold)]">
              ✦
            </div>
            <div>
              <div className="text-[11px] tracking-[2.5px] uppercase text-[var(--obsidian-text)]">
                Write a Review
              </div>
              <div className="text-[10px] text-[var(--obsidian-text-dim)] mt-[2px] tracking-[0.5px]">
                Share your experience with this piece
              </div>
            </div>
          </div>
          <div
            className={`text-[18px] text-[var(--obsidian-text-muted)] transition-transform duration-300 ${
              reviewFormOpen ? 'rotate-180' : ''
            }`}
          >
            ∨
          </div>
        </div>

        {/* Write Review Form */}
        {reviewFormOpen && (
          <div className="bg-[var(--obsidian-surface)] border border-[var(--obsidian-border)] border-t-0 px-7 py-8 animate-fadeUp">
            {/* Star Rating */}
            <div className="mb-7">
              <label className="text-[9px] tracking-[2px] uppercase text-[var(--obsidian-text-muted)] mb-3 block">
                Your Rating
              </label>
              <div className="flex gap-1.5 mb-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() => setSelectedRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className={`text-[28px] cursor-pointer transition-[color,transform] duration-150 leading-none select-none ${
                      star <= (hoveredRating || selectedRating)
                        ? 'text-[var(--obsidian-gold)]'
                        : 'text-[var(--obsidian-border)]'
                    } ${hoveredRating === star ? 'scale-[1.15]' : ''}`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <div className="text-[10px] text-[var(--obsidian-text-dim)] tracking-[1px] mt-1 min-h-[16px] transition-colors duration-200">
                {(hoveredRating || selectedRating) > 0
                  ? ratingLabels[hoveredRating || selectedRating]
                  : 'Tap a star to rate'}
              </div>
            </div>

            {/* Review Title */}
            <div className="mb-7">
              <label className="text-[9px] tracking-[2px] uppercase text-[var(--obsidian-text-muted)] mb-3 block">
                Review Title
              </label>
              <input
                type="text"
                placeholder="Sum it up in a sentence…"
                maxLength={80}
                className="w-full bg-[var(--obsidian-surface2)] border border-[var(--obsidian-border)] text-[var(--obsidian-text)] px-4 py-3 font-[family-name:var(--font-dm-sans)] text-[13px] outline-none transition-[border-color] duration-200 focus:border-[var(--obsidian-gold)] placeholder:text-[var(--obsidian-text-dim)]"
              />
            </div>

            {/* Review Body */}
            <div className="mb-7">
              <label className="text-[9px] tracking-[2px] uppercase text-[var(--obsidian-text-muted)] mb-3 block">
                Your Review
              </label>
              <textarea
                placeholder="What did you love about this piece? How does it look on your wall? Any tips for other buyers?"
                maxLength={800}
                className="w-full bg-[var(--obsidian-surface2)] border border-[var(--obsidian-border)] text-[var(--obsidian-text)] px-4 py-3.5 font-[family-name:var(--font-dm-sans)] text-[13px] outline-none transition-[border-color] duration-200 resize-vertical min-h-[110px] leading-[1.7] focus:border-[var(--obsidian-gold)] placeholder:text-[var(--obsidian-text-dim)]"
              />
            </div>

            {/* Name & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="text-[9px] tracking-[2px] uppercase text-[var(--obsidian-text-muted)] mb-3 block">
                  Your Name
                </label>
                <input
                  type="text"
                  placeholder="James H."
                  className="w-full bg-[var(--obsidian-surface2)] border border-[var(--obsidian-border)] text-[var(--obsidian-text)] px-4 py-3 font-[family-name:var(--font-dm-sans)] text-[13px] outline-none transition-[border-color] duration-200 focus:border-[var(--obsidian-gold)] placeholder:text-[var(--obsidian-text-dim)]"
                />
              </div>
              <div>
                <label className="text-[9px] tracking-[2px] uppercase text-[var(--obsidian-text-muted)] mb-3 block">
                  Location <span className="text-[var(--obsidian-text-dim)]">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="New York, USA"
                  className="w-full bg-[var(--obsidian-surface2)] border border-[var(--obsidian-border)] text-[var(--obsidian-text)] px-4 py-3 font-[family-name:var(--font-dm-sans)] text-[13px] outline-none transition-[border-color] duration-200 focus:border-[var(--obsidian-gold)] placeholder:text-[var(--obsidian-text-dim)]"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button className="w-full bg-[var(--obsidian-gold)] text-[var(--obsidian-bg)] border-none px-4 py-4 cursor-pointer font-[family-name:var(--font-dm-sans)] text-[11px] tracking-[3px] uppercase font-medium transition-all duration-250 hover:bg-[var(--obsidian-gold-light)]">
              Submit Review
            </button>

            {/* Note */}
            <div className="text-[10px] text-[var(--obsidian-text-dim)] text-center mt-3 tracking-[0.5px] leading-[1.6]">
              Your review helps other buyers make confident decisions. All reviews are moderated
              before publishing.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
