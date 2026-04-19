/**
 * Shared constants for the walldecorator application
 */

// Shipping configuration — always free
export const FREE_SHIPPING_THRESHOLD = 0
export const SHIPPING_COST = 0

// Pakistan provinces for address forms
export const PAKISTAN_PROVINCES = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Gilgit-Baltistan',
  'Azad Kashmir',
  'Islamabad Capital Territory',
] as const

export type PakistanProvince = (typeof PAKISTAN_PROVINCES)[number]
