/**
 * Multi-currency support for Obsidian Wall Art
 * Base currency: PKR (all DB prices stored in PKR)
 * Supported: PKR, USD, EUR
 */

export type CurrencyCode = 'PKR' | 'USD' | 'EUR'

export interface CurrencyInfo {
  code: CurrencyCode
  symbol: string
  name: string
  flag: string
  locale: string
  decimals: number
  /** Exchange rate relative to PKR (1 PKR = rate units of this currency) */
  rate: number
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  PKR: {
    code: 'PKR',
    symbol: 'Rs.',
    name: 'Pakistani Rupee',
    flag: '🇵🇰',
    locale: 'en-PK',
    decimals: 0,
    rate: 1,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    flag: '🇺🇸',
    locale: 'en-US',
    decimals: 2,
    rate: 0.003597, // 1 USD ≈ 278 PKR
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    flag: '🇪🇺',
    locale: 'en-EU',
    decimals: 2,
    rate: 0.003333, // 1 EUR ≈ 300 PKR
  },
}

export const CURRENCY_LIST = Object.values(CURRENCIES)

/**
 * Convert a PKR amount to the target currency
 */
export function convertPrice(pkrAmount: number, currency: CurrencyCode): number {
  return pkrAmount * CURRENCIES[currency].rate
}

/**
 * Format an already-converted amount as a currency string
 */
export function formatCurrency(convertedAmount: number, currency: CurrencyCode): string {
  const info = CURRENCIES[currency]
  return new Intl.NumberFormat(info.locale, {
    style: 'currency',
    currency: info.code,
    minimumFractionDigits: info.decimals,
    maximumFractionDigits: info.decimals,
  }).format(convertedAmount)
}

/**
 * Convert from PKR and format in one step.
 * This is the main utility used in components.
 */
export function formatPrice(pkrAmount: number, currency: CurrencyCode = 'PKR'): string {
  const converted = convertPrice(pkrAmount, currency)
  return formatCurrency(converted, currency)
}
