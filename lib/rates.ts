import { cache } from 'react'
import { db } from '@/lib/db/client'
import { redis } from '@/lib/upstash/client'
import { currencies, exchange_rate_snapshots } from '@/lib/db/schema'
import { sql, eq } from 'drizzle-orm'

const CACHE_KEY = 'currency:rates'
const CACHE_TTL = 90000 // 25 hours in seconds — survives one missed cron

export type LiveRate = {
  id: string
  rate: number
  fetched_at: string
}

// Full rates map: includes PKR (synthesized base) + all active non-base currencies
export type RatesMap = Record<string, LiveRate>

// Shape of a single row returned by the DISTINCT ON query
type RateRow = {
  id: string
  currency_code: string
  rate: string // NUMERIC comes back as string from pg
  fetched_at: Date
}

// Shape of a currency metadata row
export type CurrencyMeta = {
  code: string
  symbol: string
  name: string
  flag: string | null
  locale: string
  decimals: number
  is_base: boolean
  is_active: boolean
  display_order: number | null
}

export type RatesPayload = {
  rates: RatesMap
  currencies: CurrencyMeta[]
}

const BASE_PKR_RATE: LiveRate = {
  id: 'base',
  rate: 1,
  fetched_at: new Date().toISOString(),
}

// ─── buildRatesMap ────────────────────────────────────────────────────────────
// Converts DB rows into RatesMap and always injects PKR as the base.

function buildRatesMap(rows: RateRow[]): RatesMap {
  const map: RatesMap = { PKR: BASE_PKR_RATE }
  for (const row of rows) {
    map[row.currency_code] = {
      id: row.id,
      rate: Number(row.rate),
      fetched_at: row.fetched_at instanceof Date
        ? row.fetched_at.toISOString()
        : String(row.fetched_at),
    }
  }
  return map
}

// ─── fetchFromDb ──────────────────────────────────────────────────────────────
// DISTINCT ON query: latest snapshot per currency_code, joined with metadata.

async function fetchFromDb(): Promise<RatesPayload | null> {
  const [rateRows, currencyRows] = await Promise.all([
    db.execute<RateRow>(sql`
      SELECT DISTINCT ON (s.currency_code)
        s.id,
        s.currency_code,
        s.rate,
        s.fetched_at
      FROM exchange_rate_snapshots s
      JOIN currencies c ON c.code = s.currency_code
      WHERE c.is_active = true AND c.is_base = false
      ORDER BY s.currency_code, s.fetched_at DESC
    `),
    db.select().from(currencies).where(eq(currencies.is_active, true)),
  ])

  if (rateRows.rows.length === 0) return null

  return {
    rates: buildRatesMap(rateRows.rows),
    currencies: currencyRows as CurrencyMeta[],
  }
}

// ─── getRates ─────────────────────────────────────────────────────────────────
// Wrapped in React cache() — deduplicated within a single RSC render tree.
// Chain: Redis → DB → throw (cron will seed if DB is empty after first deploy).

export const getRates = cache(async (): Promise<RatesPayload> => {
  // 1. Redis hit
  const cached = await redis.get<RatesPayload>(CACHE_KEY)
  if (cached) {
    return typeof cached === 'string'
      ? (JSON.parse(cached) as RatesPayload)
      : cached
  }

  // 2. DB fallback
  const payload = await fetchFromDb()
  if (payload) {
    await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(payload))
    return payload
  }

  // 3. Should never reach here after first deploy (seed rows are always present).
  //    Throw so the cron/admin can fix the state rather than silently serving zeros.
  throw new Error('No exchange rate data found. Run the rate sync or check the DB seed.')
})

// ─── bustRatesCache ───────────────────────────────────────────────────────────
// Called by the cron route and admin override action after inserting new rates.

export async function bustRatesCache(): Promise<void> {
  await redis.del(CACHE_KEY)
}
