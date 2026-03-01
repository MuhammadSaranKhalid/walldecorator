import Image from 'next/image'
import Link from 'next/link'
import { getStorageUrl } from '@/lib/supabase/storage'
import type { Category } from '@/types/homepage'

type CategoryShowcaseProps = {
  categories: Category[]
}

export function CategoryShowcase({ categories }: CategoryShowcaseProps) {
  if (categories.length === 0) return null

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Explore
            </p>
            <h2 className="text-3xl font-bold text-gray-900">
              Shop by Category
            </h2>
          </div>
          <Link
            href="/products"
            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            View All →
          </Link>
        </div>

        {/* Category grid — responsive */}
        {/* 2 cols on mobile, 4 cols on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="group relative overflow-hidden rounded-2xl aspect-3/4 bg-gray-100"
            >
              {category.image_path && (
                <Image
                  src={getStorageUrl(category.image_path)}
                  alt={category.name}
                  fill
                  // Prioritize first 4 — they're above fold on desktop
                  priority={index < 4}
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

              {/* Category info */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-semibold text-lg leading-tight">
                  {category.name}
                </h3>
                {category.product_count > 0 && (
                  <p className="text-white/70 text-sm mt-0.5">
                    {category.product_count} products
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
