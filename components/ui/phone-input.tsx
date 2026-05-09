'use client'

import * as React from 'react'
import { ChevronDown, Check, Search } from 'lucide-react'
import PhoneInputBase, { getCountryCallingCode } from 'react-phone-number-input/input'
import flags from 'react-phone-number-input/flags'
import labels from 'react-phone-number-input/locale/en.json'
import { getCountries } from 'libphonenumber-js/min'
import type { Country } from 'react-phone-number-input'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

type PhoneInputProps = {
  value: string | undefined
  onChange: (value: string | undefined) => void
  onBlur?: () => void
  defaultCountry?: Country
  id?: string
  placeholder?: string
  disabled?: boolean
  className?: string
  'aria-invalid'?: boolean
}

/**
 * International phone number input.
 *
 * - Returns E.164 (e.g. "+923001234567") via react-phone-number-input.
 * - Country selector is a custom popover so it matches the obsidian design.
 * - `defaultCountry` is the geo-detected ISO-3166-1 alpha-2 code.
 */
export function PhoneInput({
  value,
  onChange,
  onBlur,
  defaultCountry = 'PK',
  id,
  placeholder,
  disabled,
  className,
  'aria-invalid': ariaInvalid,
}: PhoneInputProps) {
  const [country, setCountry] = React.useState<Country>(defaultCountry)

  // Re-sync when the geo-detected country arrives after first paint.
  // Only switches if the user hasn't already entered a number.
  React.useEffect(() => {
    if (!value) setCountry(defaultCountry)
  }, [defaultCountry, value])

  return (
    <div className={cn('flex items-stretch gap-2', className)}>
      <CountrySelect
        value={country}
        onChange={(next) => {
          setCountry(next)
          // Clear the field so the new country's calling code is applied
          // when the user types again.
          onChange(undefined)
        }}
        disabled={disabled}
      />
      <PhoneInputBase
        country={country}
        international
        withCountryCallingCode
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        id={id}
        placeholder={placeholder ?? '300 1234567'}
        inputComponent={Input as any}
        autoComplete="tel"
        aria-invalid={ariaInvalid}
      />
    </div>
  )
}

// ─── CountrySelect ───────────────────────────────────────────────────────────

type CountrySelectProps = {
  value: Country
  onChange: (next: Country) => void
  disabled?: boolean
}

const COUNTRIES: Country[] = (getCountries() as Country[]).slice().sort((a, b) => {
  const la = (labels as Record<string, string>)[a] ?? a
  const lb = (labels as Record<string, string>)[b] ?? b
  return la.localeCompare(lb)
})

function CountrySelect({ value, onChange, disabled }: CountrySelectProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const popoverRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Close on outside click / Escape
  React.useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Focus the search field when the popover opens
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
      const name = ((labels as Record<string, string>)[code] ?? code).toLowerCase()
      return name.includes(q) || code.toLowerCase().includes(q)
    })
  }, [query])

  const Flag = (flags as Record<string, React.ComponentType<{ title?: string }> | undefined>)[value]
  const callingCode = (() => {
    try {
      return `+${getCountryCallingCode(value)}`
    } catch {
      return ''
    }
  })()

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Country: ${(labels as Record<string, string>)[value] ?? value}`}
        className={cn(
          'flex h-9 items-center gap-1.5 rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs transition-[color,box-shadow] outline-none',
          'hover:border-[var(--obsidian-gold)]',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
        )}
      >
        <span className="inline-flex h-4 w-6 items-center justify-center overflow-hidden rounded-[2px]">
          {Flag ? <Flag title={value} /> : <span className="text-xs">{value}</span>}
        </span>
        <span className="text-xs text-[var(--obsidian-text-muted)] tabular-nums">{callingCode}</span>
        <ChevronDown className="h-3.5 w-3.5 text-[var(--obsidian-text-muted)]" />
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-full z-[300] mt-1.5 w-72 overflow-hidden rounded-md border border-[var(--obsidian-border)] bg-[var(--obsidian-surface)] shadow-2xl"
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
                const FlagComp = (flags as Record<string, React.ComponentType<{ title?: string }> | undefined>)[code]
                const name = (labels as Record<string, string>)[code] ?? code
                let prefix = ''
                try {
                  prefix = `+${getCountryCallingCode(code)}`
                } catch {
                  prefix = ''
                }
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
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-2 text-left transition-colors',
                      isActive
                        ? 'bg-[var(--obsidian-gold)]/10 text-[var(--obsidian-gold)]'
                        : 'text-[var(--obsidian-text)] hover:bg-[var(--obsidian-surface2)]'
                    )}
                  >
                    <span className="inline-flex h-4 w-6 items-center justify-center overflow-hidden rounded-[2px]">
                      {FlagComp ? <FlagComp title={name} /> : <span className="text-[10px]">{code}</span>}
                    </span>
                    <span className="flex-1 truncate text-sm">{name}</span>
                    <span className="text-xs text-[var(--obsidian-text-muted)] tabular-nums">{prefix}</span>
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
