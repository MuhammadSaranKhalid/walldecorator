'use client'

import { useTranslation } from 'react-i18next'

export function MaterialStrip() {
  const { t } = useTranslation('common')

  const materials = [
    { icon: '⚙️', key: 'materials.precisionLaserCut' },
    { icon: '🔩', key: 'materials.powderCoatedSteel' },
    { icon: '✈️', key: 'materials.worldwideShipping' },
  ]

  return (
    <div className="border-t border-b border-[var(--obsidian-border)] py-5 px-6 sm:px-12 flex items-center gap-0 overflow-x-auto obsidian-scrollbar relative z-[1]">
      {materials.map((item, index) => (
        <div
          key={item.key}
          className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-8 whitespace-nowrap text-[11px] text-[var(--obsidian-text-muted)] tracking-wide ${
            index === 0 ? '!pl-0' : ''
          } ${index !== materials.length - 1 ? 'border-r border-[var(--obsidian-border)]' : ''}`}
        >
          <span className="text-base">{item.icon}</span>
          <span>{t(item.key)}</span>
        </div>
      ))}
    </div>
  )
}
