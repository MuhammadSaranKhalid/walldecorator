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

  const content = (
    <div className="max-w-[480px] sm:max-w-[540px] lg:max-w-[600px]">
      {/* Eyebrow */}
      <div className="flex items-center gap-3 mb-5 lg:mb-7 text-[9px] tracking-[0.3125em] uppercase text-[var(--obsidian-gold)]">
        <div className="w-8 lg:w-10 h-px bg-[var(--obsidian-gold)]" />
        <span>{resolvedEyebrow}</span>
      </div>

      {/* Title */}
      <h1 className="font-[family-name:var(--font-cormorant)] text-[clamp(36px,9vw,88px)] font-light leading-[0.93] mb-5 lg:mb-7">
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
      <p className="text-[13px] leading-[1.85] text-[var(--obsidian-text-muted)] mb-7 lg:mb-10">
        {resolvedDescription}
      </p>

      {/* Category Pills */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-7 lg:mb-10">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="text-[9px] tracking-[0.125em] uppercase px-3 py-1.5 border border-[var(--obsidian-border)] text-[var(--obsidian-text-dim)] transition-all duration-200 hover:border-[var(--obsidian-gold)] hover:text-[var(--obsidian-gold)]"
            >
              {category.name}
            </Link>
          ))}
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Link
          href={resolvedPrimaryCTA.href}
          className="inline-flex items-center justify-center gap-3 bg-[var(--obsidian-gold)] text-[var(--obsidian-bg)] px-8 py-4 cursor-pointer font-[family-name:var(--font-dm-sans)] text-[11px] tracking-[0.1875em] uppercase font-medium transition-all duration-300 hover:bg-[var(--obsidian-gold-light)]"
        >
          {resolvedPrimaryCTA.text}
          <ArrowRight className="w-4 h-4 shrink-0" />
        </Link>

        <Link
          href={resolvedSecondaryCTA.href}
          className="inline-flex items-center justify-center gap-2.5 bg-transparent border border-[var(--obsidian-border)] text-[var(--obsidian-text-muted)] px-7 py-4 cursor-pointer font-[family-name:var(--font-dm-sans)] text-[11px] tracking-[0.125em] uppercase transition-all duration-300 hover:border-[var(--obsidian-gold)] hover:text-[var(--obsidian-gold)]"
        >
          {resolvedSecondaryCTA.text}
        </Link>
      </div>
    </div>
  )

  return (
    <>
      {/* ── MOBILE layout: video on top, content below ── */}
      <div className="lg:hidden flex flex-col">
        {/* Video block at natural 16:9 */}
        <div className="relative w-full aspect-video">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/video.mp4" type="video/mp4" />
          </video>
          {/* Bottom fade blends into content */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[var(--obsidian-bg)] to-transparent" />
        </div>

        {/* Content below video */}
        <div className="bg-[var(--obsidian-bg)] px-5 pt-6 pb-12">
          {content}
        </div>
      </div>

      {/* ── DESKTOP layout: full-screen video background ── */}
      <section className="hidden lg:flex relative items-center overflow-hidden min-h-[96vh]">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/video.mp4" type="video/mp4" />
        </video>

        {/* Left-heavy gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--obsidian-bg)]/85 via-[var(--obsidian-bg)]/55 to-[var(--obsidian-bg)]/10" />

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--obsidian-bg)] to-transparent" />

        <div className="relative z-[1] w-full px-14 xl:px-20 py-24">
          {content}
        </div>
      </section>
    </>
  )
}
