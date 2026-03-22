'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Collection {
  id: string
  name: string
  slug: string
  description: string | null
  product_count: number
  image: {
    storage_path: string
    alt_text: string | null
    blurhash: string | null
    medium_path: string | null
  } | null
}

interface CollectionsPageContentProps {
  collections: Collection[]
}

// Visual variety for the grid layout
const layoutSizes = ['large', 'tall', 'wide', 'small'] as const
const gradients = [
  'linear-gradient(135deg, #0d0a05 0%, #1a1005 100%)',
  'linear-gradient(135deg, #080a10 0%, #10141e 100%)',
  'linear-gradient(135deg, #080d08 0%, #10180a 100%)',
  'linear-gradient(135deg, #05100a 0%, #0a1e12 100%)',
  'linear-gradient(135deg, #08080d 0%, #10101a 100%)',
  'linear-gradient(135deg, #0d0a05 0%, #1a1008 100%)',
]

export function CollectionsPageContent({ collections }: CollectionsPageContentProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter collections by search
  const filteredCollections = useMemo(() => {
    if (!searchQuery) return collections
    const query = searchQuery.toLowerCase()
    return collections.filter(
      (c) => c.name.toLowerCase().includes(query) || c.description?.toLowerCase().includes(query)
    )
  }, [collections, searchQuery])

  // Calculate totals
  const totalCollections = collections.length
  const totalPieces = collections.reduce((sum, c) => sum + (c.product_count || 0), 0)

  return (
    <div className="relative z-[1]">
      {/* Hero Section */}
      <div className="min-h-[68vh] flex items-end px-6 sm:px-12 pb-20 relative overflow-hidden border-b border-[var(--obsidian-border)]">
        {/* Background */}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#0d0905_0%,#180e05_40%,#080a0d_100%)]" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'linear-gradient(var(--obsidian-border) 1px, transparent 1px), linear-gradient(90deg, var(--obsidian-border) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />

        {/* Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-px h-px bg-[var(--obsidian-gold)] rounded-full animate-particleDrift"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDuration: `${8 + Math.random() * 4}s`,
                animationDelay: `${Math.random() * 8}s`,
              }}
            />
          ))}
        </div>

        {/* Large Emoji (decorative) */}
        <div className="absolute right-20 bottom-0 opacity-[0.12] text-[320px] leading-none pointer-events-none filter blur-[2px]">
          🌿
        </div>

        {/* Content */}
        <div className="relative z-[2] max-w-[640px]">
          <div className="flex items-center gap-3.5 text-[9px] tracking-[4px] uppercase text-[var(--obsidian-gold)] mb-6">
            <div className="w-10 h-px bg-[var(--obsidian-gold)]" />
            Curated Worlds — 2026 Edit
          </div>
          <h1 className="font-[family-name:var(--font-cormorant)] text-[clamp(56px,8vw,112px)] font-light leading-[0.9] text-[var(--obsidian-text)] mb-7 tracking-[-2px]">
            The
            <br />
            <em className="italic text-[var(--obsidian-gold)]">Collections</em>
          </h1>
          <p className="text-[13px] leading-[1.9] text-[var(--obsidian-text-muted)] max-w-[500px] mb-9">
            Six universes. From the electric worlds of anime to the quiet power of nature — each
            collection is a carefully considered point of view in laser-cut form.
          </p>
          <div className="flex gap-11">
            <div>
              <div className="font-[family-name:var(--font-cormorant)] text-[38px] font-light text-[var(--obsidian-gold)] leading-none">
                {totalCollections}
              </div>
              <div className="text-[9px] tracking-[2px] uppercase text-[var(--obsidian-text-dim)] mt-1">
                Collections
              </div>
            </div>
            <div>
              <div className="font-[family-name:var(--font-cormorant)] text-[38px] font-light text-[var(--obsidian-gold)] leading-none">
                {totalPieces}
              </div>
              <div className="text-[9px] tracking-[2px] uppercase text-[var(--obsidian-text-dim)] mt-1">
                Pieces
              </div>
            </div>
            <div>
              <div className="font-[family-name:var(--font-cormorant)] text-[38px] font-light text-[var(--obsidian-gold)] leading-none">
                3
              </div>
              <div className="text-[9px] tracking-[2px] uppercase text-[var(--obsidian-text-dim)] mt-1">
                Materials
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute right-12 bottom-20 z-[2] hidden lg:flex flex-col items-center gap-2 text-[var(--obsidian-text-dim)] text-[9px] tracking-[2px] uppercase">
          <span>Scroll</span>
          <div className="w-px h-14 bg-[linear-gradient(to_bottom,var(--obsidian-gold),transparent)] animate-scrollDrop" />
        </div>
      </div>

      {/* Grid Section */}
      <div className="px-6 sm:px-12 py-18">
        {/* Header */}
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div className="font-[family-name:var(--font-cormorant)] text-[36px] font-light">
            All Collections{' '}
            <em className="italic text-[var(--obsidian-text-muted)] text-[22px] ml-3">
              — {filteredCollections.length} Available
            </em>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[var(--obsidian-surface)] border border-[var(--obsidian-border)] text-[var(--obsidian-text)] px-4 py-2 font-[family-name:var(--font-dm-sans)] text-[10px] tracking-[2px] uppercase focus:outline-none focus:border-[var(--obsidian-gold)] transition-colors duration-200"
            />
          </div>
        </div>

        {/* Masonry Grid */}
        {filteredCollections.length === 0 ? (
          <div className="text-center py-20 text-[var(--obsidian-text-muted)] text-xs tracking-[2px] uppercase">
            No collections found
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-[2px]">
            {filteredCollections.map((collection, index) => {
              const size = layoutSizes[index % layoutSizes.length]
              const gradient = gradients[index % gradients.length]

              return (
                <Link
                  key={collection.id}
                  href={`/products?category=${collection.slug}`}
                  className={`relative overflow-hidden cursor-pointer bg-[var(--obsidian-surface)] group ${
                    size === 'large'
                      ? 'col-span-12 lg:col-span-8 row-span-2'
                      : size === 'tall'
                      ? 'col-span-12 lg:col-span-4 row-span-2'
                      : size === 'wide'
                      ? 'col-span-12 lg:col-span-6'
                      : 'col-span-12 lg:col-span-4'
                  }`}
                >
                  {/* Inner Container */}
                  <div
                    className={`w-full h-full relative flex items-end transition-transform duration-[0.6s] cubic-bezier(0.4,0,0.2,1) group-hover:scale-[1.02] ${
                      size === 'large' || size === 'tall' ? 'min-h-[600px]' : 'min-h-[320px]'
                    }`}
                  >
                    {/* Background with image or gradient */}
                    {collection.image?.medium_path || collection.image?.storage_path ? (
                      <div className="absolute inset-0">
                        <Image
                          src={collection.image.medium_path ?? collection.image.storage_path}
                          alt={collection.image.alt_text ?? collection.name}
                          fill
                          className="object-cover opacity-30"
                          placeholder={collection.image.blurhash ? 'blur' : undefined}
                          blurDataURL={collection.image.blurhash || undefined}
                        />
                        <div className="absolute inset-0" style={{ background: gradient, opacity: 0.85 }} />
                      </div>
                    ) : (
                      <div className="absolute inset-0" style={{ background: gradient }} />
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.93)_0%,rgba(0,0,0,0.25)_55%,rgba(0,0,0,0.05)_100%)] transition-all duration-400 group-hover:bg-[linear-gradient(to_top,rgba(0,0,0,0.97)_0%,rgba(0,0,0,0.45)_60%,rgba(0,0,0,0.12)_100%)]" />

                    {/* Content */}
                    <div className="relative z-[2] p-7 w-full">
                      <div className="flex items-center gap-2 text-[8px] tracking-[3px] uppercase text-[var(--obsidian-gold)] mb-2">
                        <div className="w-4 h-px bg-[var(--obsidian-gold)]" />
                        Collection
                      </div>
                      <div
                        className={`font-[family-name:var(--font-cormorant)] font-light leading-[1.1] mb-2 text-[var(--obsidian-text)] ${
                          size === 'large' ? 'text-[clamp(32px,4vw,50px)]' : 'text-[clamp(22px,3vw,38px)]'
                        }`}
                      >
                        {collection.name}
                      </div>
                      <div className="flex items-center gap-3.5 mb-4">
                        <div className="text-[11px] text-[var(--obsidian-text-muted)]">
                          {collection.product_count} pieces
                        </div>
                      </div>
                      {collection.description && (
                        <div className="text-[12px] text-[var(--obsidian-text-muted)] leading-[1.7] max-w-[380px] mb-5 opacity-0 translate-y-2 transition-all duration-300 delay-[50ms] group-hover:opacity-100 group-hover:translate-y-0">
                          {collection.description}
                        </div>
                      )}
                      <div className="inline-flex items-center gap-2.5 text-[10px] tracking-[3px] uppercase text-[var(--obsidian-gold)] opacity-0 translate-y-1.5 transition-all duration-300 delay-[100ms] group-hover:opacity-100 group-hover:translate-y-0">
                        Explore
                        <div className="relative w-7 h-px bg-[var(--obsidian-gold)] transition-[width] duration-300 group-hover:w-10">
                          <span className="absolute right-[-2px] top-[-8px] text-[16px]">›</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
