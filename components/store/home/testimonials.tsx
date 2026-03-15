import type { Testimonial } from '@/types/homepage'

const testimonials: Testimonial[] = [
  {
    id: 1,
    quote:
      "Best purchase I've made this year. The quality exceeded my expectations.",
    author: 'Sarah M.',
    location: 'Karachi',
    rating: 5,
  },
  {
    id: 2,
    quote:
      'Shipping was incredibly fast and the packaging was beautiful. Will definitely buy again.',
    author: 'James K.',
    location: 'Lahore',
    rating: 5,
  },
  {
    id: 3,
    quote:
      'Customer service was outstanding when I had a question. Highly recommend.',
    author: 'Emily R.',
    location: 'Islamabad',
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section className="py-20 bg-primary">
      <div className="container mx-auto px-4">

        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-2">
            Customer Reviews
          </p>
          <h2 className="text-3xl font-bold text-primary-foreground">
            What Our Customers Say
          </h2>

          {/* Aggregate rating */}
          <div className="flex items-center justify-center gap-1 mt-4">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="h-5 w-5 text-accent fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-2 text-primary-foreground/60 text-sm">
              4.9 / 5 from 2,400+ reviews
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-primary-foreground/5 rounded-2xl p-6 border border-primary-foreground/10"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {[...Array(t.rating)].map((_, i) => (
                  <svg key={i} className="h-4 w-4 text-accent fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-primary-foreground/90 leading-relaxed mb-5 text-sm">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-sm font-bold text-accent shrink-0">
                  {t.author[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary-foreground">
                    {t.author}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs text-primary-foreground/50">{t.location}</p>
                    <span className="text-primary-foreground/30 text-xs">·</span>
                    <p className="text-xs text-accent/70 font-medium">Verified Purchase</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
