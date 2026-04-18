import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CurrencyCode } from '@/lib/currency'
import type { RatesMap, CurrencyMeta } from '@/lib/rates'

type CurrencyStore = {
  currency: CurrencyCode
  manuallySelected: boolean
  setCurrency: (code: CurrencyCode) => void      // geo/system use only
  selectCurrency: (code: CurrencyCode) => void   // explicit user pick

  // Live rates injected from the server on every page load — NOT persisted
  rates: RatesMap
  currencyList: CurrencyMeta[]
  setRates: (rates: RatesMap, currencyList: CurrencyMeta[]) => void
}

// Fallback rates used only before the server injects live data (hydration gap).
// These match the seed values so there is no flash of wrong prices.
const FALLBACK_RATES: RatesMap = {
  PKR: { id: 'base', rate: 1,          fetched_at: '' },
  USD: { id: 'seed', rate: 0.003597,   fetched_at: '' },
  EUR: { id: 'seed', rate: 0.003333,   fetched_at: '' },
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set) => ({
      currency: 'PKR',
      manuallySelected: false,
      setCurrency: (code) => set({ currency: code }),
      selectCurrency: (code) => set({ currency: code, manuallySelected: true }),

      rates: FALLBACK_RATES,
      currencyList: [],
      setRates: (rates, currencyList) => set({ rates, currencyList }),
    }),
    {
      name: 'obsidian-currency',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ currency: state.currency, manuallySelected: state.manuallySelected }),
    }
  )
)
