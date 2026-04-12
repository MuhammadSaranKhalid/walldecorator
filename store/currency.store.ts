import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CurrencyCode } from '@/lib/currency'

type CurrencyStore = {
  currency: CurrencyCode
  setCurrency: (code: CurrencyCode) => void
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set) => ({
      currency: 'PKR',
      setCurrency: (code) => set({ currency: code }),
    }),
    {
      name: 'obsidian-currency',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
