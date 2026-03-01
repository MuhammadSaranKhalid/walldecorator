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
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Social Proof
          </p>
          <h2 className="text-3xl font-bold text-gray-900">
            What Our Customers Say
          </h2>
          <div className="flex items-center justify-center gap-1 mt-3">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-yellow-400 text-xl">
                ★
              </span>
            ))}
            <span className="ml-2 text-gray-500 text-sm">
              4.9/5 from 2,400+ reviews
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {[...Array(t.rating)].map((_, i) => (
                  <span key={i} className="text-yellow-400">
                    ★
                  </span>
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-700 leading-relaxed mb-4">{t.quote}</p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
                  {t.author[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {t.author}
                  </p>
                  <p className="text-xs text-gray-400">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
