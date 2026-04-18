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

  // Apply geo-detected hint only when user has never explicitly chosen a currency.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      if (parsed?.state?.manuallySelected) return
    } catch {
      // corrupt storage — fall through and apply hint
    }

    const hint = readCookie('obsidian-currency-hint')
    if (hint && VALID_CURRENCIES.includes(hint as CurrencyCode)) {
      setCurrency(hint as CurrencyCode)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>
}
