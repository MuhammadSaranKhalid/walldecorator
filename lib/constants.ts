/**
 * Shared constants for the walldecorator application
 */

// Shipping configuration
export const FREE_SHIPPING_THRESHOLD = 5000 // Free shipping for orders >= Rs 5,000
export const SHIPPING_COST = 200 // Standard shipping cost in PKR

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
