'use client'

import { useEffect } from 'react'
import { useCurrencyStore } from '@/store/currency.store'
import type { CurrencyCode } from '@/lib/currency'
import type { RatesMap, CurrencyMeta } from '@/lib/rates'

const VALID_CURRENCIES: CurrencyCode[] = ['PKR', 'USD', 'EUR']
const STORAGE_KEY = 'obsidian-currency'

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)')
  )
  return match ? decodeURIComponent(match[1]) : null
}

type Props = {
  children: React.ReactNode
  initialRates: RatesMap
  initialCurrencyList: CurrencyMeta[]
}

export function CurrencyProvider({ children, initialRates, initialCurrencyList }: Props) {
  const { setCurrency, setRates } = useCurrencyStore()

  // Always inject fresh rates from the server — runs on every page load
  useEffect(() => {
    setRates(initialRates, initialCurrencyList)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Apply geo-detected hint only when user has no persisted preference.
  // Re-evaluates whenever localStorage is cleared — self-healing.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    console.debug('CurrencyProvider: stored currency', stored)
    if (stored) return // user has an explicit choice, never override

    const hint = readCookie('obsidian-currency-hint')
    if (hint && VALID_CURRENCIES.includes(hint as CurrencyCode)) {
      setCurrency(hint as CurrencyCode)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>
}
