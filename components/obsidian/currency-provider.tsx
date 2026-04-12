'use client'

import { useEffect } from 'react'
import { useCurrencyStore } from '@/store/currency.store'
import type { CurrencyCode } from '@/lib/currency'

const VALID_CURRENCIES: CurrencyCode[] = ['PKR', 'USD', 'EUR']

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)')
  )
  return match ? decodeURIComponent(match[1]) : null
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
}

/**
 * Mount once in the root layout.
 *
 * Logic:
 * 1. obsidian-currency-set cookie = "we have already initialised the currency".
 *    If it exists, do nothing — Zustand rehydrates from localStorage on its own.
 * 2. On a fresh first visit (no cookie), read the geo-detected hint that
 *    middleware wrote from the Vercel x-vercel-ip-country header.
 * 3. After applying the hint, write obsidian-currency-set so middleware skips
 *    geo-detection and this provider skips the hint on all future visits.
 *
 * NOTE: We intentionally do NOT check localStorage here. Zustand's persist
 * middleware writes the default PKR value to localStorage on first mount before
 * this effect runs, which would make a localStorage check always return "stored"
 * and prevent the geo hint from ever being applied.
 */
export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { setCurrency } = useCurrencyStore()

  useEffect(() => {
    // Already initialised — Zustand handles rehydration from localStorage
    if (readCookie('obsidian-currency-set')) return

    // First visit — apply the geo-detected hint written by middleware
    const hint = readCookie('obsidian-currency-hint')
    if (hint && VALID_CURRENCIES.includes(hint as CurrencyCode)) {
      setCurrency(hint as CurrencyCode)
    }

    // Mark as initialised so neither this effect nor middleware runs again
    writeCookie('obsidian-currency-set', '1')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>
}
