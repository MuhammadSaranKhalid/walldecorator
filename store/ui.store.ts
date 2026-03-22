import { create } from 'zustand'

type CheckoutStep = 'delivery' | 'payment' | 'review' | 'confirmation'

type UIStore = {
  // Mobile menu
  isMobileMenuOpen: boolean
  openMobileMenu: () => void
  closeMobileMenu: () => void
  toggleMobileMenu: () => void

  // Search
  isSearchOpen: boolean
  searchQuery: string
  openSearch: () => void
  closeSearch: () => void
  setSearchQuery: (query: string) => void

  // Checkout modal
  isCheckoutModalOpen: boolean
  checkoutStep: CheckoutStep
  orderId: string | null
  openCheckoutModal: () => void
  closeCheckoutModal: () => void
  setCheckoutStep: (step: CheckoutStep) => void
  setOrderId: (orderId: string) => void
  resetCheckout: () => void

  // Product detail page
  isProductDetailOpen: boolean
  currentProductSlug: string | null
  openProductDetail: (slug: string) => void
  closeProductDetail: () => void

  // Collections page
  isCollectionsPageOpen: boolean
  currentCollectionId: string | null
  openCollectionsPage: () => void
  closeCollectionsPage: () => void
  openCollection: (collectionId: string) => void
  closeCollection: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  // Mobile menu
  isMobileMenuOpen: false,
  openMobileMenu: () => set({ isMobileMenuOpen: true }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

  // Search
  isSearchOpen: false,
  searchQuery: '',
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false, searchQuery: '' }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Checkout modal
  isCheckoutModalOpen: false,
  checkoutStep: 'delivery',
  orderId: null,
  openCheckoutModal: () => set({ isCheckoutModalOpen: true, checkoutStep: 'delivery' }),
  closeCheckoutModal: () => set({ isCheckoutModalOpen: false }),
  setCheckoutStep: (step) => set({ checkoutStep: step }),
  setOrderId: (orderId) => set({ orderId }),
  resetCheckout: () => set({ checkoutStep: 'delivery', orderId: null }),

  // Product detail page
  isProductDetailOpen: false,
  currentProductSlug: null,
  openProductDetail: (slug) => set({ isProductDetailOpen: true, currentProductSlug: slug }),
  closeProductDetail: () => set({ isProductDetailOpen: false, currentProductSlug: null }),

  // Collections page
  isCollectionsPageOpen: false,
  currentCollectionId: null,
  openCollectionsPage: () => set({ isCollectionsPageOpen: true }),
  closeCollectionsPage: () => set({ isCollectionsPageOpen: false, currentCollectionId: null }),
  openCollection: (collectionId) => set({ currentCollectionId: collectionId }),
  closeCollection: () => set({ currentCollectionId: null }),
}))
