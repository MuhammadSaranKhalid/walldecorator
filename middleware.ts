import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Country → currency mapping.
 * Based on ISO 3166-1 alpha-2 country codes injected by Vercel's edge network
 * via the x-vercel-ip-country header (available as request.geo.country).
 * Anything not listed here defaults to PKR.
 */
const COUNTRY_CURRENCY: Record<string, string> = {
  // ── USD ──────────────────────────────────────────────────────────
  US: 'USD', // United States
  CA: 'USD', // Canada (CAD, but we map to USD as closest supported)
  AU: 'USD', // Australia
  NZ: 'USD', // New Zealand
  SG: 'USD', // Singapore
  HK: 'USD', // Hong Kong
  AE: 'USD', // UAE (dirham pegged to USD)
  SA: 'USD', // Saudi Arabia
  QA: 'USD', // Qatar
  KW: 'USD', // Kuwait
  BH: 'USD', // Bahrain
  OM: 'USD', // Oman
  JO: 'USD', // Jordan

  // ── EUR ──────────────────────────────────────────────────────────
  DE: 'EUR', // Germany
  FR: 'EUR', // France
  IT: 'EUR', // Italy
  ES: 'EUR', // Spain
  NL: 'EUR', // Netherlands
  BE: 'EUR', // Belgium
  AT: 'EUR', // Austria
  PT: 'EUR', // Portugal
  FI: 'EUR', // Finland
  IE: 'EUR', // Ireland
  GR: 'EUR', // Greece
  SK: 'EUR', // Slovakia
  SI: 'EUR', // Slovenia
  EE: 'EUR', // Estonia
  LV: 'EUR', // Latvia
  LT: 'EUR', // Lithuania
  LU: 'EUR', // Luxembourg
  MT: 'EUR', // Malta
  CY: 'EUR', // Cyprus
  HR: 'EUR', // Croatia

  // ── GBP ──────────────────────────────────────────────────────────
  GB: 'GBP', // United Kingdom
  
  // Non-eurozone mapped to EUR
  SE: 'EUR', // Sweden
  NO: 'EUR', // Norway
  DK: 'EUR', // Denmark
  CH: 'EUR', // Switzerland
  PL: 'EUR', // Poland
  CZ: 'EUR', // Czech Republic
  HU: 'EUR', // Hungary
  RO: 'EUR', // Romania
  // ── PKR (default) — PK + everything else ─────────────────────────
}

function countryToCurrency(country: string | undefined): string {
  if (!country) return 'PKR'
  return COUNTRY_CURRENCY[country.toUpperCase()] ?? 'PKR'
}

export async function middleware(request: NextRequest) {
  // Run Supabase session refresh first and get its response
  const response = await updateSession(request)

  // ── Geo-based currency hint ────────────────────────────────────────────────
  // Always refresh the hint cookie so it stays accurate across visits.
  // The CurrencyProvider only applies it when the user has no localStorage
  // preference — so a manual selection is never overridden.
  const country = request.headers.get('x-vercel-ip-country') ?? undefined

  const detectedCurrency = countryToCurrency(country)
  console.log('Middleware: detected country', country)
  console.log('Middleware: mapped currency', detectedCurrency)

  response.cookies.set('obsidian-currency-hint', detectedCurrency, {
    path: '/',
    maxAge: 60 * 60 * 24, // 24 h — refreshed on every visit
    sameSite: 'lax',
    httpOnly: false, // must be readable by client JS
  })

  return response
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (Next.js static assets)
     * - _next/image  (image optimisation)
     * - favicon.ico
     * - public folder files (images, locales, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|txt|xml)$).*)',
  ],
}
