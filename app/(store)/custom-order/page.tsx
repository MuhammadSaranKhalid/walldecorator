import type { Metadata } from 'next'
import { CustomCraftSectionLazy } from '@/components/CustomCraftSectionLazy'

export const metadata: Metadata = {
  title: 'Custom Order — Wall Decorator',
  description:
    'Have a unique idea? We bring custom metal wall art to life. Upload your design, choose your specs, and get a personalised quote within 24 hours.',
  openGraph: {
    title: 'Custom Order — Wall Decorator',
    description: 'Submit your custom metal wall art request and get a quote within 24 hours.',
    type: 'website',
  },
}

const steps = [
  {
    number: '01',
    title: 'Submit Your Design',
    description: 'Upload your image or describe your idea. Any artwork, logo, or concept works.',
  },
  {
    number: '02',
    title: 'Get Your Quote',
    description: "We'll review your request and send a personalised price within 24 hours.",
  },
  {
    number: '03',
    title: 'We Craft It',
    description: 'Our team laser-cuts, finishes, and quality-checks every piece by hand.',
  },
  {
    number: '04',
    title: 'Delivered to You',
    description: 'Securely packaged and shipped nationwide — ready to hang.',
  },
]

export default function CustomOrderPage() {
  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <p className="text-sm font-semibold tracking-widest uppercase text-accent mb-3">
            Made for You
          </p>
          <h1 className="text-4xl lg:text-5xl font-bold text-primary-foreground leading-tight text-balance">
            Your Vision, Our Craft
          </h1>
          <p className="mt-4 text-primary-foreground/70 text-lg leading-relaxed">
            Have a unique idea? We specialise in bringing custom metal wall art to life —
            any design, any size, any material. Submit your request and we&apos;ll quote you within 24 hours.
          </p>
        </div>
      </section>

      {/* ── Process Steps ────────────────────────────────────────── */}
      <section className="py-14 bg-secondary/50 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col gap-2">
                <span className="text-3xl font-bold text-accent/30 leading-none">
                  {step.number}
                </span>
                <h3 className="text-sm font-semibold text-primary">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Custom Craft Form ────────────────────────────────────── */}
      <CustomCraftSectionLazy />
    </main>
  )
}
