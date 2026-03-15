import Link from 'next/link'

const highlights = [
  '100% hand-crafted to your specifications',
  'Any design — logo, art, text, silhouette',
  'Pakistan-wide delivery',
  'Quote within 24 hours',
]

export function CustomCraftTeaser() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="rounded-3xl bg-primary overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">

            {/* Left — content */}
            <div className="p-10 lg:p-14 flex flex-col justify-center">
              <p className="text-sm font-semibold tracking-widest uppercase text-accent mb-3">
                Made for You
              </p>
              <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground leading-tight text-balance">
                Your Vision, Our Craft
              </h2>
              <p className="mt-4 text-primary-foreground/70 leading-relaxed max-w-md">
                Have a unique idea? We bring custom metal wall art to life — any design, any size.
                Upload your concept and get a personalised quote within 24 hours.
              </p>

              {/* Highlights */}
              <ul className="mt-6 space-y-2.5">
                {highlights.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-primary-foreground/80">
                    <svg className="h-4 w-4 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href="/custom-order"
                className="mt-8 inline-flex items-center gap-2 self-start px-7 py-3.5 bg-accent text-accent-foreground font-semibold rounded-full shadow-lg hover:bg-accent/90 hover:shadow-xl transition-all duration-200"
              >
                Start Your Custom Order
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            {/* Right — decorative grid of process steps */}
            <div className="hidden lg:flex flex-col justify-center bg-primary-foreground/5 border-l border-primary-foreground/10 p-14 gap-8">
              {[
                { num: '01', label: 'Submit Your Design' },
                { num: '02', label: 'Receive Your Quote' },
                { num: '03', label: 'We Craft It' },
                { num: '04', label: 'Delivered to You' },
              ].map((step) => (
                <div key={step.num} className="flex items-center gap-4">
                  <span className="text-4xl font-bold text-accent/20 leading-none w-14 shrink-0">
                    {step.num}
                  </span>
                  <span className="text-base font-semibold text-primary-foreground/80">
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
