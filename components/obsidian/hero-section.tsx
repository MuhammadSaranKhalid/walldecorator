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
    <section className="min-h-[96vh] grid grid-cols-1 lg:grid-cols-2 items-center overflow-hidden relative z-[1]">
      {/* Left Content */}
      <div className="px-6 sm:px-10 lg:px-14 py-10 sm:py-14 lg:py-20">
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

        {/* Subtitle */}
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

      {/* Right Visual */}
      <div className="h-[96vh] bg-[var(--obsidian-surface)] relative overflow-hidden hidden lg:flex items-center justify-center">
        {/* Wall texture */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#181410_0%,#0f0d0a_100%)]" />

        {/* Radial gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,#1e1508_0%,#080808_100%)]" />

        {/* Glow effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,168,76,0.06)_0%,transparent_70%)]" />

        {/* Shadow at bottom */}
        <div className="absolute bottom-[60px] left-1/2 -translate-x-1/2 w-[200px] h-6 bg-[radial-gradient(ellipse,rgba(0,0,0,0.8)_0%,transparent_70%)] blur-[8px]" />

        {/* Floating SVG Art - Kid Goku */}
        <div className="relative z-[2] animate-heroFloat">
          <svg viewBox="0 0 300 400" width="260" height="346" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_40px_60px_rgba(0,0,0,0.8)]">
            <defs>
              <radialGradient id="artGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.15"/>
                <stop offset="100%" stopColor="#c9a84c" stopOpacity="0"/>
              </radialGradient>
            </defs>
            <ellipse cx="150" cy="380" rx="90" ry="12" fill="rgba(0,0,0,0.5)"/>
            <g fill="#c9a84c" opacity="0.92">
              <polygon points="130,60 120,15 140,50" />
              <polygon points="145,55 132,8 155,45" />
              <polygon points="158,52 148,5 165,42" />
              <polygon points="170,58 162,12 178,50" />
              <polygon points="115,70 102,28 125,62" />
              <ellipse cx="150" cy="85" rx="32" ry="35" />
              <rect x="138" y="115" width="24" height="18" rx="4"/>
              <path d="M110,130 Q108,185 112,220 L188,220 Q192,185 190,130 Q170,125 150,126 Q130,125 110,130Z" />
              <path d="M135,128 L150,175 L165,128" fill="#080808" opacity="0.5"/>
              <rect x="112" y="210" width="76" height="14" rx="2" fill="#080808" opacity="0.7"/>
              <rect x="140" y="208" width="20" height="18" rx="2" fill="#080808" opacity="0.8"/>
              <path d="M110,135 Q80,145 68,125 Q60,110 72,98 Q82,90 95,100 Q100,120 110,130Z"/>
              <ellipse cx="68" cy="115" rx="16" ry="14"/>
              <path d="M190,135 Q215,145 224,165 Q230,180 218,188 Q208,192 200,180 Q195,165 188,148Z"/>
              <ellipse cx="222" cy="175" rx="14" ry="13"/>
              <path d="M118,222 Q108,270 112,310 Q116,330 128,332 Q140,330 142,308 Q142,275 148,222Z"/>
              <path d="M182,222 Q192,270 188,310 Q184,330 172,332 Q160,330 158,308 Q158,275 152,222Z"/>
              <ellipse cx="118" cy="338" rx="22" ry="12"/>
              <ellipse cx="182" cy="338" rx="22" ry="12"/>
              <path d="M185,210 Q220,205 240,185 Q255,168 245,155 Q238,148 228,158 Q218,172 200,175" fill="none" stroke="#c9a84c" strokeWidth="12" strokeLinecap="round"/>
              <path d="M240,180 Q252,170 248,158" fill="none" stroke="#c9a84c" strokeWidth="8" strokeLinecap="round"/>
              <circle cx="150" cy="170" r="10" fill="#080808" opacity="0.6"/>
            </g>
            <ellipse cx="150" cy="360" rx="60" ry="8" fill="url(#artGlow)"/>
          </svg>
        </div>

        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[54%] w-[280px] h-[280px] bg-[radial-gradient(ellipse,rgba(201,168,76,0.06)_0%,transparent_70%)] rounded-full z-[1]" />

        {/* Art Label */}
        <div className="absolute bottom-[100px] left-1/2 -translate-x-1/2 text-[9px] tracking-[0.1875em] uppercase text-[var(--obsidian-text-dim)] whitespace-nowrap z-[3]">
          {t('hero.artLabel')}
        </div>

        {/* Stat Box 1 - Unique Designs */}
        <div className="absolute bottom-12 -left-5 z-[4] bg-[var(--obsidian-bg)] border border-[var(--obsidian-border)] px-6 py-[18px]">
          <div className="font-[family-name:var(--font-cormorant)] text-[32px] font-light text-[var(--obsidian-gold)] leading-none">
            {t('hero.stats.uniqueDesigns')}
          </div>
          <div className="text-[9px] tracking-[0.125em] text-[var(--obsidian-text-muted)] uppercase mt-1">
            {t('hero.stats.uniqueDesignsLabel')}
          </div>
        </div>

        {/* Stat Box 2 - Materials */}
        <div className="absolute top-20 -right-4 z-[4] bg-[var(--obsidian-bg)] border border-[var(--obsidian-border)] px-5 py-4">
          <div className="text-[9px] tracking-[0.125em] text-[var(--obsidian-text-dim)] uppercase mb-1.5">
            {t('hero.stats.materialsLabel')}
          </div>
          <div className="font-[family-name:var(--font-cormorant)] text-[20px] font-light text-[var(--obsidian-gold)] leading-none">
            {t('hero.stats.materials')}
          </div>
        </div>
      </div>

      {/* Mobile version - simpler */}
      <div className="lg:hidden h-[60vw] min-h-[240px] bg-[var(--obsidian-surface)] relative overflow-hidden flex items-center justify-center">
        <div className="relative z-[2] animate-heroFloat">
          <svg width="140" height="186" viewBox="0 0 140 186">
            <rect
              x="20"
              y="20"
              width="100"
              height="146"
              fill="var(--obsidian-surface2)"
              stroke="var(--obsidian-gold)"
              strokeWidth="1.5"
            />
            <text
              x="70"
              y="93"
              textAnchor="middle"
              fill="var(--obsidian-gold)"
              fontSize="32"
            >
              🎨
            </text>
          </svg>
        </div>
      </div>
    </section>
  )
}
