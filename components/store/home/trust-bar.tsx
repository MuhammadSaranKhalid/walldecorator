import type { TrustItem } from '@/types/homepage'

const trustItems: TrustItem[] = [
  { icon: '🚚', title: 'Free Shipping', subtitle: 'On orders over Rs. 5,000' },
  { icon: '↩️', title: '30-Day Returns', subtitle: 'Hassle-free returns' },
  { icon: '🔒', title: 'Secure Checkout', subtitle: '256-bit SSL encrypted' },
  { icon: '💬', title: '24/7 Support', subtitle: "We're here to help" },
]

export function TrustBar() {
  return (
    <section className="border-y border-border bg-secondary py-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {trustItems.map((item) => (
            <div key={item.title} className="flex items-center gap-3">
              <span className="text-2xl shrink-0">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold text-primary">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
