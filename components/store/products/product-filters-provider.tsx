'use client'

import { createContext, use, useTransition } from 'react'
import { useQueryStates } from 'nuqs'
import { productSearchParams } from '@/lib/search-params/products'

type ProductFiltersContextValue = {
  params: ReturnType<typeof useQueryStates<typeof productSearchParams>>[0]
  setParams: ReturnType<typeof useQueryStates<typeof productSearchParams>>[1]
  isPending: boolean
  startTransition: React.TransitionStartFunction
}

const ProductFiltersContext = createContext<ProductFiltersContextValue | null>(null)

export function ProductFiltersProvider({ children }: { children: React.ReactNode }) {
  const [isPending, startTransition] = useTransition()
  const [params, setParams] = useQueryStates(productSearchParams, {
    shallow: false,
    startTransition,
  })

  return (
    <ProductFiltersContext value={{ params, setParams, isPending, startTransition }}>
      {children}
    </ProductFiltersContext>
  )
}

export function useProductFilters() {
  const context = use(ProductFiltersContext)
  if (!context) {
    throw new Error('useProductFilters must be used within a ProductFiltersProvider')
  }
  return context
}
