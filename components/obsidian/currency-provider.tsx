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
 * 1. If the user has ever had a currency stored (obsidian-currency-set cookie),
 *    the Zustand store was already rehydrated from localStorage — do nothing.
 * 2. On a fresh first visit, the hint cookie was set by middleware from the
 *    user's Vercel geo header. We read it and initialise the store.
 * 3. After initialisation we write obsidian-currency-set so the middleware
 *    stops overwriting the hint on future requests.
 */
export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { setCurrency } = useCurrencyStore()

  useEffect(() => {
    // If Zustand already persisted a value to localStorage, honour it.
    const stored = localStorage.getItem('obsidian-currency')
    if (stored) {
      // Mark as set so middleware skips geo-detection on subsequent visits
      if (!readCookie('obsidian-currency-set')) {
        writeCookie('obsidian-currency-set', '1')
      }
      return
    }

    // First visit — read the geo-detected hint written by middleware
    const hint = readCookie('obsidian-currency-hint')
    if (hint && VALID_CURRENCIES.includes(hint as CurrencyCode)) {
      setCurrency(hint as CurrencyCode)
    }

    // Mark that currency has been initialised; middleware won't set hint again
    writeCookie('obsidian-currency-set', '1')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>
}
