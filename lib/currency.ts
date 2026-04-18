import type { RatesMap, CurrencyMeta } from '@/lib/rates'

export type CurrencyCode = 'PKR' | 'USD' | 'EUR'

// Static display metadata — these values never change, only rates change
export const CURRENCY_META: Record<CurrencyCode, Omit<CurrencyMeta, 'is_base' | 'is_active' | 'display_order'>> = {
  PKR: { code: 'PKR', symbol: 'Rs.', name: 'Pakistani Rupee', flag: '🇵🇰', locale: 'en-PK', decimals: 0 },
  USD: { code: 'USD', symbol: '$',   name: 'US Dollar',       flag: '🇺🇸', locale: 'en-US', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€',   name: 'Euro',            flag: '🇪🇺', locale: 'de-DE', decimals: 2 },
}

// ─── convertPrice ─────────────────────────────────────────────────────────────

export function convertPrice(pkrAmount: number, currency: string, rates: RatesMap): number {
  if (currency === 'PKR') return pkrAmount
  const liveRate = rates[currency]?.rate
  if (!liveRate) return pkrAmount
  return pkrAmount * liveRate
}

// ─── formatCurrency ───────────────────────────────────────────────────────────

export function formatCurrency(convertedAmount: number, currency: string): string {
  const meta = CURRENCY_META[currency as CurrencyCode]
  if (!meta) return String(convertedAmount)
  return new Intl.NumberFormat(meta.locale, {
    style: 'currency',
    currency: meta.code,
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  }).format(convertedAmount)
}

// ─── formatPrice ─────────────────────────────────────────────────────────────
// Main utility used in components. Converts PKR → target currency and formats.
// Pass live rates from the Zustand store (useCurrencyStore().rates).

export function formatPrice(pkrAmount: number, currency: string = 'PKR', rates: RatesMap): string {
  const converted = convertPrice(pkrAmount, currency, rates)
  return formatCurrency(converted, currency)
}
