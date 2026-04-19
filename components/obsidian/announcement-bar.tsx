'use client'

import { Truck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function AnnouncementBar() {
  const { t } = useTranslation('common')

  return (
    <div className="fixed top-0 left-0 right-0 z-[101] w-full bg-[var(--obsidian-gold)] text-[var(--obsidian-bg)] py-2 px-4 flex items-center justify-center gap-2 text-[10px] tracking-[0.15em] uppercase font-medium font-[family-name:var(--font-dm-sans)]">
      <Truck className="w-3.5 h-3.5 shrink-0" />
      <span>{t('announcement.freeShipping')}</span>
    </div>
  )
}
