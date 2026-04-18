'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface HeroSectionProps {
  categories: { id: string; name: string; slug: string }[]
}

export function ObsidianHeroSection({ categories }: HeroSectionProps) {
  const { t } = useTranslation('common')

  const resolvedTitle = t('hero.title')
  const resolvedSubtitle = t('hero.subtitle')
  const resolvedTitleLine3 = t('hero.titleLine3')
  const resolvedEyebrow = t('hero.eyebrow')
  const resolvedDescription = t('hero.description')
  const resolvedPrimaryCTA = { text: t('hero.primaryCTA'), href: '/products' }
  const resolvedSecondaryCTA = { text: t('hero.secondaryCTA'), href: '/collections' }

  return (
    <section className="min-h-[96vh] relative flex items-center overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/video.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay so text remains readable */}
      <div className="absolute inset-0 bg-[var(--obsidian-bg)]/60" />

      {/* Content */}
      <div className="relative z-[1] px-6 sm:px-10 lg:px-14 py-10 sm:py-14 lg:py-20 max-w-3xl">
        {/* Eyebrow */}
        <div className="flex items-center gap-3.5 mb-7 text-[9px] tracking-[0.3125em] uppercase text-[var(--obsidian-gold)]">
          <div className="w-10 h-px bg-[var(--obsidian-gold)]" />
          <span>{resolvedEyebrow}</span>
        </div>

        {/* Title */}
        <h1 className="font-[family-name:var(--font-cormorant)] text-[clamp(40px,7.5vw,92px)] font-light leading-[0.95] mb-8">
          {resolvedTitle}
          <br />
          <em className="italic text-[var(--obsidian-gold)]">{resolvedSubtitle}</em>
          {resolvedTitleLine3 && (
            <>
              <br />
              {resolvedTitleLine3}
            </>
          )}
        </h1>

        {/* Description */}
        <p className="text-sm leading-[1.9] text-[var(--obsidian-text-muted)] max-w-[400px] mb-10">
          {resolvedDescription}
        </p>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-11">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="text-[9px] tracking-[0.125em] uppercase px-3.5 py-1.5 border border-[var(--obsidian-border)] text-[var(--obsidian-text-dim)] transition-all duration-200 hover:border-[var(--obsidian-gold)] hover:text-[var(--obsidian-gold)]"
            >
              {category.name}
            </Link>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex items-center flex-wrap gap-3">
          <Link
            href={resolvedPrimaryCTA.href}
            className="inline-flex items-center gap-4 bg-[var(--obsidian-gold)] text-[var(--obsidian-bg)] px-9 py-4 border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[11px] tracking-[0.1875em] uppercase font-medium transition-all duration-300 hover:bg-[var(--obsidian-gold-light)] hover:translate-x-1"
          >
            {resolvedPrimaryCTA.text}
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href={resolvedSecondaryCTA.href}
            className="inline-flex items-center gap-2.5 bg-transparent border border-[var(--obsidian-border)] text-[var(--obsidian-text-muted)] px-7 py-4 cursor-pointer font-[family-name:var(--font-dm-sans)] text-[11px] tracking-[0.125em] uppercase transition-all duration-300 hover:border-[var(--obsidian-gold)] hover:text-[var(--obsidian-gold)]"
          >
            {resolvedSecondaryCTA.text}
          </Link>
        </div>
      </div>
    </section>
  )
}
