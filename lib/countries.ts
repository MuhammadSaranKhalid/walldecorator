// Server-safe country helpers. No React, no 'use client' — importable from
// server actions, route handlers, and client components alike.

import labels from 'react-phone-number-input/locale/en.json'

const LABELS = labels as Record<string, string>

/** Look up the human-readable English name for an ISO-3166-1 alpha-2 code. */
export function getCountryName(code: string | undefined | null): string {
  if (!code) return ''
  return LABELS[code.toUpperCase()] ?? code.toUpperCase()
}
