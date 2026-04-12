import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItemImage } from '@/store/cart.store'

export type WishlistItem = {
  productId: string
  variantId: string
  productName: string
  variantDescription: string
  price: number
  oldPrice?: number
  image: CartItemImage | null
  addedAt: number
}

type WishlistStore = {
  items: WishlistItem[]
  isOpen: boolean

  // Actions
  addItem: (item: Omit<WishlistItem, 'addedAt'>) => void
  removeItem: (variantId: string) => void
  isInWishlist: (variantId: string) => boolean
  toggleItem: (item: Omit<WishlistItem, 'addedAt'>) => void
  clearWishlist: () => void
  openWishlist: () => void
  closeWishlist: () => void
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === newItem.variantId)
          if (existing) return state

          return {
            items: [...state.items, { ...newItem, addedAt: Date.now() }],
          }
        }),

      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        })),

      isInWishlist: (variantId) => {
        return get().items.some((item) => item.variantId === variantId)
      },

      toggleItem: (item) => {
        const inWishlist = get().isInWishlist(item.variantId)
        if (inWishlist) {
          get().removeItem(item.variantId)
        } else {
          get().addItem(item)
        }
      },

      clearWishlist: () => set({ items: [] }),
      openWishlist: () => set({ isOpen: true }),
      closeWishlist: () => set({ isOpen: false }),
    }),

    {
      name: 'wishlist-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
)
