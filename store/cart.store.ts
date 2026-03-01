import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ProductDetailImage } from '@/types/products'

export type CartItem = {
  variantId: string
  productName: string
  variantDescription: string
  sku: string
  price: number
  quantity: number
  image: ProductDetailImage | null
}

type CartStore = {
  items: CartItem[]
  isOpen: boolean

  // Actions
  addItem: (item: CartItem) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void

  // Computed getters
  getTotalItems: () => number
  getTotalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === newItem.variantId)

          if (existing) {
            // Increment quantity if variant already in cart
            return {
              items: state.items.map((item) =>
                item.variantId === newItem.variantId
                  ? { ...item, quantity: item.quantity + newItem.quantity }
                  : item
              ),
            }
          }

          // Add new item to cart
          return { items: [...state.items, newItem] }
        }),

      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        })),

      updateQuantity: (variantId, quantity) =>
        set((state) => {
          if (quantity === 0) {
            // Remove item if quantity is 0
            return { items: state.items.filter((item) => item.variantId !== variantId) }
          }

          // Update quantity
          return {
            items: state.items.map((item) =>
              item.variantId === variantId ? { ...item, quantity } : item
            ),
          }
        }),

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      getTotalPrice: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }),

    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist items, not isOpen state
      // The drawer shouldn't reopen automatically on page refresh
      partialize: (state) => ({ items: state.items }),
    }
  )
)
