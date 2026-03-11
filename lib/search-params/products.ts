import {
  parseAsString,
  parseAsInteger,
  parseAsStringEnum,
  createSearchParamsCache,
  createSerializer,
} from 'nuqs/server'

// Sort options as a strict enum
export const sortOptions = ['newest', 'price-asc', 'price-desc', 'popularity'] as const
export type SortOption = (typeof sortOptions)[number]

// Define every possible URL parameter with its type and default value
export const productSearchParams = {
  // Category filter — single string (slug)
  category: parseAsString.withDefault(''),

  // Sorting
  sort: parseAsStringEnum([...sortOptions]).withDefault('newest'),

  // Pagination
  page: parseAsInteger.withDefault(1),

  // Items per page
  limit: parseAsInteger.withDefault(20),
}

// Server-side cache — lets deeply nested Server Components
// access parsed params without prop drilling
export const searchParamsCache = createSearchParamsCache(productSearchParams)

// Serializer — lets Client Components build type-safe URLs
export const serializeProductParams = createSerializer(productSearchParams)
