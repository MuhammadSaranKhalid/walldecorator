import Link from 'next/link'

type PromoBannerProps = {
  data: {
    headline: string
    subheadline: string
    ctaText: string
    ctaLink: string
    backgroundColor: string
  }
}

export function PromoBanner({ data }: PromoBannerProps) {
  return (
    <section className="py-20" style={{ backgroundColor: data.backgroundColor }}>
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-white/70 mb-3">
          Limited Time Offer
        </p>

        <h2 className="text-4xl lg:text-6xl font-bold text-white mb-4">
          {data.headline}
        </h2>

        <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
          {data.subheadline}
        </p>

        <Link
          href={data.ctaLink}
          className="
            inline-block px-10 py-4 bg-accent text-accent-foreground
            font-semibold text-base rounded-full shadow-lg
            hover:bg-accent/90 hover:shadow-xl transition-all duration-200
          "
        >
          {data.ctaText}
        </Link>
      </div>
    </section>
  )
}
