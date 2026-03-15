const trustItems = [
  {
    icon: (
      <svg className="h-6 w-6 shrink-0 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75"
          d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM1 1h4l2.68 13.39a2 2 0 001.98 1.61h9.72a2 2 0 001.98-1.61L23 6H6" />
      </svg>
    ),
    title: 'Free Shipping',
    subtitle: 'On orders over Rs. 5,000',
  },
  {
    icon: (
      <svg className="h-6 w-6 shrink-0 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75"
          d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
      </svg>
    ),
    title: '30-Day Returns',
    subtitle: 'Hassle-free returns',
  },
  {
    icon: (
      <svg className="h-6 w-6 shrink-0 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Secure Checkout',
    subtitle: '256-bit SSL encrypted',
  },
  {
    icon: (
      <svg className="h-6 w-6 shrink-0 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: '24/7 Support',
    subtitle: "We're here to help",
  },
]

const paymentMethods = ['Cash on Delivery', 'JazzCash', 'Easypaisa', 'Visa', 'Mastercard']

export function TrustBar() {
  return (
    <section className="border-y border-border bg-secondary">
      {/* Trust items */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {trustItems.map((item) => (
            <div key={item.title} className="flex items-center gap-3">
              {item.icon}
              <div>
                <p className="text-sm font-semibold text-primary">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment methods strip */}
      <div className="border-t border-border/50 bg-secondary/60 py-2.5">
        <div className="container mx-auto px-4 flex items-center justify-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1">Accepted payments:</span>
          {paymentMethods.map((method) => (
            <span
              key={method}
              className="text-xs font-medium text-muted-foreground border border-border rounded px-2 py-0.5 bg-background"
            >
              {method}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
