import Image from 'next/image'
import Link from 'next/link'
import { getStorageUrl } from '@/lib/supabase/storage'

type HeroProps = {
  data: {
    headline: string
    subheadline: string
    ctaText: string
    ctaLink: string
    imagePath: string | null
  }
}

export function HeroSection({ data }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-secondary via-background to-accent/10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[85vh] lg:min-h-[75vh] items-center gap-8 py-16">
          {/* Left — Text Content */}
          <div className="flex flex-col items-start order-2 lg:order-1">
            {/* Eyebrow label */}
            <span className="text-sm font-semibold tracking-widest uppercase text-accent mb-4">
              New Collection 2025
            </span>

            {/* Main headline — largest text on page, critical for LCP */}
            <h1 className="text-5xl lg:text-7xl font-bold text-primary leading-tight">
              {data.headline}
            </h1>

            {/* Subheadline */}
            <p className="mt-4 text-lg text-muted-foreground max-w-md leading-relaxed">
              {data.subheadline}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 mt-8">
              <Link
                href={data.ctaLink}
                className="
                  px-8 py-4 bg-primary text-primary-foreground text-base font-semibold
                  rounded-full hover:bg-primary/90 shadow-lg hover:shadow-xl
                  transition-all duration-200 hover:scale-105
                  active:scale-100
                "
              >
                {data.ctaText}
              </Link>
              <Link
                href="/products"
                className="
                  px-8 py-4 bg-transparent text-accent-foreground text-base font-semibold
                  rounded-full border-2 border-accent
                  hover:bg-accent hover:text-accent-foreground
                  transition-all duration-200
                "
              >
                View All
              </Link>
            </div>

            {/* Inline trust signals — right below CTA */}
            <div className="flex items-center gap-6 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span>🚚</span>
                <span>Free shipping Rs. 5,000+</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>↩️</span>
                <span>30-day returns</span>
              </div>
            </div>
          </div>

          {/* Right — Hero Image */}
          <div className="relative order-1 lg:order-2 aspect-4/5 lg:aspect-auto lg:h-[75vh]">
            <Image
              src={data.imagePath ? getStorageUrl(data.imagePath) : '/image_no_gemini.png'}
              alt="New Collection"
              fill
              loading="eager" // LCP element — load immediately
              quality={90}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover rounded-3xl"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
            />
          </div>
        </div>
      </div>
    </section>
  )
}
