import Link from 'next/link'
import { ObsidianProductCard } from './product-card'
import { ArrowRight } from 'lucide-react'

interface ProductsSectionProps {
  title: string
  subtitle?: string
  products: any[] // Flexible type to accept any product structure
  viewAllHref?: string
  badge?: 'new' | 'sale' | 'hot' | 'limited' | null
}

export function ObsidianProductsSection({
  title,
  subtitle,
  products,
  viewAllHref = '/products',
  badge,
}: ProductsSectionProps) {
  return (
    <section className="px-6 sm:px-12 py-16">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h2 className="font-[family-name:var(--font-cormorant)] text-[42px] font-light leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[var(--obsidian-text-muted)] italic font-[family-name:var(--font-cormorant)] text-[28px] font-light mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* View All Link */}
        <Link
          href={viewAllHref}
          className="hidden sm:flex items-center gap-2 text-[11px] tracking-[0.125em] uppercase text-[var(--obsidian-text-muted)] transition-colors duration-200 hover:text-[var(--obsidian-gold)]"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0.5">
        {products.map((product, index) => (
          <ObsidianProductCard
            key={product.id}
            product={product}
            badge={badge}
            animationDelay={index * 50}
          />
        ))}
      </div>

      {/* Mobile View All */}
      <div className="sm:hidden mt-8 text-center">
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-2 text-[11px] tracking-[0.125em] uppercase text-[var(--obsidian-text-muted)] transition-colors duration-200 hover:text-[var(--obsidian-gold)]"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}
