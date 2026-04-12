'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'

export function ObsidianFooter() {
  const { t } = useTranslation('common')
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    shop: [
      { nameKey: 'footer.links.allProducts', href: '/products' },
      { nameKey: 'footer.links.bestsellers', href: '/products?filter=bestsellers' },
      { nameKey: 'footer.links.newArrivals', href: '/products?filter=new' },
      { nameKey: 'footer.links.collections', href: '/collections' },
    ],
    support: [
      { nameKey: 'footer.links.customOrder', href: '/custom-order' },
      { nameKey: 'footer.links.trackOrder', href: '/track-order' },
      { nameKey: 'footer.links.shippingInfo', href: '/shipping' },
      { nameKey: 'footer.links.returns', href: '/returns' },
    ],
    company: [
      { nameKey: 'footer.links.aboutUs', href: '/about' },
      { nameKey: 'footer.links.contact', href: '/contact' },
      { nameKey: 'footer.links.privacyPolicy', href: '/privacy' },
      { nameKey: 'footer.links.termsOfService', href: '/terms' },
    ],
  }

  return (
    <footer className="mt-20 border-t border-[var(--obsidian-border)] bg-[var(--obsidian-bg)] relative z-[1]">
      {/* Main Footer */}
      <div className="px-6 sm:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-5">
            <div className="mb-6">
              <div className="font-[family-name:var(--font-cormorant)] text-[24px] font-semibold tracking-[0.375em] text-[var(--obsidian-gold)] uppercase leading-none">
                OBSIDIAN
              </div>
              <div className="text-[9px] tracking-[0.1875em] uppercase text-[var(--obsidian-text-dim)] mt-1.5">
                Wall Art & Decor
              </div>
            </div>
            <p className="text-[13px] leading-relaxed text-[var(--obsidian-text-muted)] max-w-md mb-6">
              {t('footer.tagline')}
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              {['Facebook', 'Instagram', 'Twitter'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-10 h-10 border border-[var(--obsidian-border)] flex items-center justify-center text-[var(--obsidian-text-muted)] text-xs transition-all duration-200 hover:border-[var(--obsidian-gold)] hover:text-[var(--obsidian-gold)]"
                  aria-label={social}
                >
                  {social[0]}
                </a>
              ))}
            </div>
          </div>

          {/* Shop Links */}
          <div className="lg:col-span-2">
            <h3 className="text-[9px] tracking-[0.125em] uppercase text-[var(--obsidian-text-dim)] mb-6 font-medium">
              {t('footer.sections.shop')}
            </h3>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.nameKey}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-[var(--obsidian-text-muted)] transition-colors duration-200 hover:text-[var(--obsidian-gold)]"
                  >
                    {t(link.nameKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div className="lg:col-span-2">
            <h3 className="text-[9px] tracking-[0.125em] uppercase text-[var(--obsidian-text-dim)] mb-6 font-medium">
              {t('footer.sections.support')}
            </h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.nameKey}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-[var(--obsidian-text-muted)] transition-colors duration-200 hover:text-[var(--obsidian-gold)]"
                  >
                    {t(link.nameKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div className="lg:col-span-3">
            <h3 className="text-[9px] tracking-[0.125em] uppercase text-[var(--obsidian-text-dim)] mb-6 font-medium">
              {t('footer.sections.company')}
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.nameKey}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-[var(--obsidian-text-muted)] transition-colors duration-200 hover:text-[var(--obsidian-gold)]"
                  >
                    {t(link.nameKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-[var(--obsidian-border)] pt-12 pb-8 mb-8">
          <div className="max-w-2xl">
            <h3 className="font-[family-name:var(--font-cormorant)] text-[28px] font-light mb-3">
              {t('footer.newsletter.title')}
            </h3>
            <p className="text-[13px] text-[var(--obsidian-text-muted)] mb-6">
              {t('footer.newsletter.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 max-w-md">
              <input
                type="email"
                placeholder={t('footer.newsletter.placeholder')}
                className="flex-1 bg-[var(--obsidian-surface2)] border border-[var(--obsidian-border)] text-[var(--obsidian-text)] px-4 py-3 text-[13px] outline-none transition-colors duration-200 focus:border-[var(--obsidian-gold)] placeholder:text-[var(--obsidian-text-dim)]"
              />
              <button className="bg-[var(--obsidian-gold)] text-[var(--obsidian-bg)] px-6 py-3 text-[11px] tracking-[0.1875em] uppercase font-medium transition-colors duration-200 hover:bg-[var(--obsidian-gold-light)] sm:w-auto">
                {t('footer.newsletter.subscribe')}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[var(--obsidian-border)] pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-[11px] text-[var(--obsidian-text-dim)]">
            {t('footer.copyright', { year: currentYear })}
          </div>
          <div className="flex flex-wrap gap-4 sm:gap-6 text-[11px] text-[var(--obsidian-text-dim)]">
            <Link href="/privacy" className="hover:text-[var(--obsidian-gold)] transition-colors duration-200">
              {t('footer.privacy')}
            </Link>
            <Link href="/terms" className="hover:text-[var(--obsidian-gold)] transition-colors duration-200">
              {t('footer.terms')}
            </Link>
            <Link href="/cookies" className="hover:text-[var(--obsidian-gold)] transition-colors duration-200">
              {t('footer.cookies')}
            </Link>
          </div>
        </div>
      </div>

      {/* Made in Pakistan Badge */}
      <div className="border-t border-[var(--obsidian-border)] px-6 sm:px-12 py-4">
        <div className="flex items-center justify-center gap-2 text-[10px] text-[var(--obsidian-text-dim)]">
          <span>🇵🇰</span>
          <span>{t('footer.madeIn')}</span>
        </div>
      </div>
    </footer>
  )
}
