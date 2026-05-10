'use client'

import * as React from 'react'
import { ChevronDown, Check, Search } from 'lucide-react'
import flags from 'react-phone-number-input/flags'
import labels from 'react-phone-number-input/locale/en.json'
import { getCountries } from 'libphonenumber-js/min'
import type { Country } from 'react-phone-number-input'

import { cn } from '@/lib/utils'

type CountrySelectProps = {
  value: Country | undefined
  onChange: (next: Country) => void
  onBlur?: () => void
  id?: string
  disabled?: boolean
  'aria-invalid'?: boolean
  className?: string
}

const COUNTRIES: Country[] = (getCountries() as Country[]).slice().sort((a, b) => {
  const la = (labels as Record<string, string>)[a] ?? a
  const lb = (labels as Record<string, string>)[b] ?? b
  return la.localeCompare(lb)
})

const LABELS = labels as Record<string, string>
const FLAGS = flags as Record<string, React.ComponentType<{ title?: string }> | undefined>

/**
 * Searchable country picker. Stores ISO-3166-1 alpha-2 (e.g. "PK", "US").
 * Uses the same flag set + locale data as the phone input for consistency.
 */
export function CountrySelect({
  value,
  onChange,
  onBlur,
  id,
  disabled,
  'aria-invalid': ariaInvalid,
  className,
}: CountrySelectProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const popoverRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        setOpen(false)
        onBlur?.()
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        onBlur?.()
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onBlur])

  React.useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 0)
      return () => window.clearTimeout(id)
    }
    setQuery('')
  }, [open])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return COUNTRIES
    return COUNTRIES.filter((code) => {
      const name = (LABELS[code] ?? code).toLowerCase()
      return name.includes(q) || code.toLowerCase().includes(q)
    })
  }, [query])

  const selectedFlag = value ? FLAGS[value] : undefined
  const selectedName = value ? LABELS[value] ?? value : 'Select country'

  return (
    <div className={cn('relative w-full', className)}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={ariaInvalid}
        className={cn(
          'flex h-11 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition-[color,box-shadow] outline-none',
          'hover:border-[var(--obsidian-gold)]',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'
        )}
      >
        <span className="flex items-center gap-2.5 truncate">
          <span className="inline-flex h-4 w-6 shrink-0 items-center justify-center overflow-hidden rounded-[2px]">
            {selectedFlag ? (
              React.createElement(selectedFlag, { title: selectedName })
            ) : (
              <span className="text-[10px] text-[var(--obsidian-text-muted)]">??</span>
            )}
          </span>
          <span className={cn('truncate', !value && 'text-[var(--obsidian-text-muted)]')}>
            {selectedName}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[var(--obsidian-text-muted)]" />
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-full z-[300] mt-1.5 w-full overflow-hidden rounded-md border border-[var(--obsidian-border)] bg-[var(--obsidian-surface)] shadow-2xl"
          role="listbox"
        >
          <div className="flex items-center gap-2 border-b border-[var(--obsidian-border)] px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-[var(--obsidian-text-muted)]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search countries"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--obsidian-text-muted)]"
            />
          </div>

          <div className="max-h-72 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-[var(--obsidian-text-muted)]">
                No countries found
              </div>
            ) : (
              filtered.map((code) => {
                const Flag = FLAGS[code]
                const name = LABELS[code] ?? code
                const isActive = code === value
                return (
                  <button
                    key={code}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => {
                      onChange(code)
                      setOpen(false)
                      onBlur?.()
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-2 text-left transition-colors',
                      isActive
                        ? 'bg-[var(--obsidian-gold)]/10 text-[var(--obsidian-gold)]'
                        : 'text-[var(--obsidian-text)] hover:bg-[var(--obsidian-surface2)]'
                    )}
                  >
                    <span className="inline-flex h-4 w-6 items-center justify-center overflow-hidden rounded-[2px]">
                      {Flag ? <Flag title={name} /> : <span className="text-[10px]">{code}</span>}
                    </span>
                    <span className="flex-1 truncate text-sm">{name}</span>
                    {isActive && <Check className="h-3.5 w-3.5 shrink-0" />}
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
