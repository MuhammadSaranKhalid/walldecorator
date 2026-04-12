'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/config'
import { Globe, ChevronDown, Search } from 'lucide-react'

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language)
    ?? SUPPORTED_LANGUAGES[0]

  const filtered = search.trim()
    ? SUPPORTED_LANGUAGES.filter(
        (l) =>
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          l.nativeName.toLowerCase().includes(search.toLowerCase()),
      )
    : SUPPORTED_LANGUAGES

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 bg-transparent border border-[var(--obsidian-border)] text-[var(--obsidian-text-muted)] px-2.5 py-2 cursor-pointer font-[family-name:var(--font-dm-sans)] text-[10px] tracking-[0.1em] uppercase transition-all duration-250 hover:border-[var(--obsidian-gold)] hover:text-[var(--obsidian-gold)]"
        aria-label={t('language.select')}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Globe className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:block">{currentLang.flag}</span>
        <span className="hidden md:block max-w-[60px] truncate">{currentLang.code.toUpperCase()}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-64 bg-[var(--obsidian-surface)] border border-[var(--obsidian-border)] z-[300] shadow-2xl"
          role="listbox"
          aria-label={t('language.select')}
        >
          {/* Search */}
          <div className="p-2 border-b border-[var(--obsidian-border)]">
            <div className="flex items-center gap-2 bg-[var(--obsidian-surface2)] border border-[var(--obsidian-border)] px-2.5 py-1.5">
              <Search className="w-3 h-3 text-[var(--obsidian-text-dim)] shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder={t('language.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-[var(--obsidian-text)] text-[11px] w-full placeholder:text-[var(--obsidian-text-dim)]"
              />
            </div>
          </div>

          {/* Language list */}
          <div className="max-h-72 overflow-y-auto obsidian-scrollbar">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-[11px] text-[var(--obsidian-text-dim)]">
                No results
              </div>
            ) : (
              filtered.map((lang) => {
                const isActive = lang.code === i18n.language
                return (
                  <button
                    key={lang.code}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => handleSelect(lang.code)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer transition-colors duration-150 ${
                      isActive
                        ? 'bg-[var(--obsidian-gold)]/10 text-[var(--obsidian-gold)]'
                        : 'text-[var(--obsidian-text-muted)] hover:bg-[var(--obsidian-surface2)] hover:text-[var(--obsidian-text)]'
                    }`}
                  >
                    <span className="text-base leading-none">{lang.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium truncate">{lang.nativeName}</div>
                      <div className="text-[10px] opacity-60 truncate">{lang.name}</div>
                    </div>
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--obsidian-gold)] shrink-0" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
