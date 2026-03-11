'use server'

import { getProducts } from '@/queries/products'
import type { SearchParams } from 'nuqs/server'
import { searchParamsCache } from '@/lib/search-params/products'

/**
 * Server Action for loading more products
 * Used by infinite scroll functionality
 */
export async function loadMoreProducts(searchParams: SearchParams) {
  const parsedParams = searchParamsCache.parse(searchParams)
  const products = await getProducts(parsedParams)

  return {
    items: products.items,
    hasMore: parsedParams.page * parsedParams.limit < products.totalCount,
    totalCount: products.totalCount,
    currentPage: parsedParams.page,
  }
}
