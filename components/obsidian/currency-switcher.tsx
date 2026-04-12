'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { useCurrencyStore } from '@/store/currency.store'
import { CURRENCY_LIST, type CurrencyCode } from '@/lib/currency'

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrencyStore()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const current = CURRENCY_LIST.find((c) => c.code === currency) ?? CURRENCY_LIST[0]

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const handleSelect = (code: CurrencyCode) => {
    setCurrency(code)
    setOpen(false)
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 bg-transparent border border-[var(--obsidian-border)] text-[var(--obsidian-text-muted)] px-2.5 py-2 cursor-pointer font-[family-name:var(--font-dm-sans)] text-[10px] tracking-[0.1em] uppercase transition-all duration-250 hover:border-[var(--obsidian-gold)] hover:text-[var(--obsidian-gold)]"
        aria-label="Select currency"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span>{current.flag}</span>
        <span className="hidden sm:block">{current.code}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-44 bg-[var(--obsidian-surface)] border border-[var(--obsidian-border)] z-[300] shadow-2xl"
          role="listbox"
          aria-label="Currency"
        >
          {CURRENCY_LIST.map((c) => {
            const isActive = c.code === currency
            return (
              <button
                key={c.code}
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(c.code)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer transition-colors duration-150 ${
                  isActive
                    ? 'bg-[var(--obsidian-gold)]/10 text-[var(--obsidian-gold)]'
                    : 'text-[var(--obsidian-text-muted)] hover:bg-[var(--obsidian-surface2)] hover:text-[var(--obsidian-text)]'
                }`}
              >
                <span className="text-base leading-none">{c.flag}</span>
                <div className="flex-1">
                  <div className="text-[11px] font-medium">{c.code}</div>
                  <div className="text-[10px] opacity-60">{c.name}</div>
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--obsidian-gold)] shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
