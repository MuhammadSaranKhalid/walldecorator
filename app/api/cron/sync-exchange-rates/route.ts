import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { exchange_rate_snapshots, currencies } from '@/lib/db/schema'
import { bustRatesCache, getRates } from '@/lib/rates'
import { eq } from 'drizzle-orm'

// ExchangeRate-API response shape (free tier — base currency endpoint)
type ExchangeRateApiResponse = {
  result: 'success' | 'error'
  base_code: string
  conversion_rates: Record<string, number>
}

export async function GET(request: Request) {
  // Verify Vercel cron secret — prevents unauthorized triggers
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'EXCHANGE_RATE_API_KEY not set' }, { status: 500 })
    }

    // Fetch all active non-base currencies from DB to know which codes to sync
    const activeCurrencies = await db
      .select({ code: currencies.code })
      .from(currencies)
      .where(eq(currencies.is_active, true))

    const targetCodes = activeCurrencies
      .map((c) => c.code)
      .filter((code) => code !== 'PKR')

    if (targetCodes.length === 0) {
      return NextResponse.json({ message: 'No non-base currencies to sync' })
    }

    // Fetch rates from ExchangeRate-API (base = PKR)
    const res = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/PKR`,
      { next: { revalidate: 0 } }
    )

    if (!res.ok) {
      return NextResponse.json(
        { error: `ExchangeRate-API returned ${res.status}` },
        { status: 502 }
      )
    }

    const data: ExchangeRateApiResponse = await res.json()

    if (data.result !== 'success') {
      return NextResponse.json(
        { error: 'ExchangeRate-API error', detail: data },
        { status: 502 }
      )
    }

    const now = new Date()
    const synced: Record<string, number> = {}

    // Insert a new snapshot row for each active non-base currency
    for (const code of targetCodes) {
      const rate = data.conversion_rates[code]
      if (!rate) continue

      await db.insert(exchange_rate_snapshots).values({
        currency_code: code,
        base_currency: 'PKR',
        rate: String(rate),
        source: 'cron_auto',
        api_provider: 'exchangerate-api',
        fetched_at: now,
      })

      synced[code] = rate
    }

    // Bust Redis cache so the next request fetches fresh rates
    await bustRatesCache()

    // Pre-warm cache immediately so first request after cron is fast
    await getRates()

    return NextResponse.json({
      success: true,
      synced_at: now.toISOString(),
      rates: synced,
    })
  } catch (err) {
    console.error('[cron/sync-exchange-rates]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
