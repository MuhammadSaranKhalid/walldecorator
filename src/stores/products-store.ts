import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product, SortOption } from "@/types/product";
import {
  getMinPrice,
  getProductMaterialIds,
  calculateMaxPrice,
} from "@/lib/product-helpers";

interface ProductsState {
  // Filters
  selectedMaterials: string[];
  priceRange: [number, number];
  sortBy: SortOption;

  // Pagination & Products
  currentPage: number;
  allLoadedProducts: Product[];
  hasMore: boolean;

  // Basic Actions
  setSelectedMaterials: (materials: string[]) => void;
  toggleMaterial: (materialId: string) => void;
  setPriceRange: (range: [number, number]) => void;
  setSortBy: (sortBy: SortOption) => void;
  setCurrentPage: (page: number) => void;
  setAllLoadedProducts: (products: Product[]) => void;
  appendProducts: (products: Product[]) => void;
  setHasMore: (hasMore: boolean) => void;
  clearFilters: () => void;
  resetState: () => void;

  // Business Logic Actions
  handleProductsFetched: (
    products: Product[],
    totalProducts: number,
    itemsPerPage: number,
    hasError: boolean
  ) => void;
  loadMoreProducts: (
    isLoading: boolean,
    hasError: boolean,
    totalProducts: number
  ) => void;
  resetPagination: () => void;
  updatePriceRangeMax: (maxPrice: number) => void;

  // Computed/Derived State
  getFilteredProducts: () => Product[];
  getMaxPrice: () => number;
  hasActiveFilters: () => boolean;
}

const initialState = {
  selectedMaterials: [],
  priceRange: [0, 1000] as [number, number],
  sortBy: "popularity" as SortOption,
  currentPage: 1,
  allLoadedProducts: [],
  hasMore: true,
};

/**
 * Global Products Page State Store
 *
 * This store manages the state for the products listing page, including:
 * - Filters (materials, price range, sort order) - persisted in localStorage
 * - Loaded products and pagination state - kept in memory only
 * - Business logic for filtering, sorting, and pagination
 *
 * Benefits:
 * - Filters persist across page navigation and browser refresh
 * - Products state persists during navigation (prevents "No products found" flash)
 * - Improves UX by maintaining user's filter preferences
 * - Centralizes business logic for better testability and reusability
 */
export const useProductsStore = create<ProductsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ========================================
      // Basic Actions
      // ========================================

      setSelectedMaterials: (materials) => {
        set({ selectedMaterials: materials });
        get().resetPagination();
      },

      toggleMaterial: (materialId) => {
        set((state) => ({
          selectedMaterials: state.selectedMaterials.includes(materialId)
            ? state.selectedMaterials.filter((m) => m !== materialId)
            : [...state.selectedMaterials, materialId],
        }));
        get().resetPagination();
      },

      setPriceRange: (range) => {
        set({ priceRange: range });
        get().resetPagination();
      },

      setSortBy: (sortBy) => {
        set({ sortBy });
        get().resetPagination();
      },

      setCurrentPage: (page) => set({ currentPage: page }),

      setAllLoadedProducts: (products) =>
        set({ allLoadedProducts: products }),

      appendProducts: (products) =>
        set((state) => {
          const existingIds = new Set(
            state.allLoadedProducts.map((p) => String(p.id))
          );
          const newProducts = products.filter(
            (p) => !existingIds.has(String(p.id))
          );
          return {
            allLoadedProducts: [...state.allLoadedProducts, ...newProducts],
          };
        }),

      setHasMore: (hasMore) => set({ hasMore }),

      clearFilters: () => {
        const maxPrice = get().getMaxPrice();
        set({
          selectedMaterials: [],
          priceRange: [0, maxPrice],
        });
        get().resetPagination();
      },

      resetState: () => set(initialState),

      // ========================================
      // Business Logic Actions
      // ========================================

      /**
       * Handle products fetched from API
       * Manages product accumulation and hasMore state
       */
      handleProductsFetched: (products, totalProducts, itemsPerPage, hasError) => {
        const state = get();

        if (products.length > 0) {
          if (state.currentPage === 1) {
            // Reset products when on page 1 (filters changed or initial load)
            set({ allLoadedProducts: products });
          } else {
            // Append new products for subsequent pages
            get().appendProducts(products);
          }
        }

        // Check if we've loaded all products
        // hasMore is false if:
        // 1. We received fewer products than requested (end of data)
        // 2. Total loaded products >= total count
        // 3. We got an empty response on a page > 1 (definitely no more data)
        const receivedFewerThanRequested = products.length < itemsPerPage;
        const totalLoaded = state.currentPage * itemsPerPage;
        const reachedTotal = totalLoaded >= totalProducts;
        const emptyResponseOnLaterPage =
          products.length === 0 && state.currentPage > 1;

        set({
          hasMore:
            !receivedFewerThanRequested &&
            !reachedTotal &&
            !emptyResponseOnLaterPage &&
            totalProducts > 0 &&
            !hasError,
        });
      },

      /**
       * Load more products (for infinite scroll)
       * Handles pagination increment with validation
       */
      loadMoreProducts: (isLoading, hasError, totalProducts) => {
        const state = get();

        // Prevent loading more if:
        // - Already loading
        // - Has errors
        // - No more data available
        // - Already loaded all products
        if (isLoading || hasError || !state.hasMore) {
          return;
        }

        const totalLoaded = state.allLoadedProducts.length;
        const canLoadMore = totalLoaded < totalProducts;

        // Only increment page if we genuinely have more data
        if (canLoadMore) {
          set({ currentPage: state.currentPage + 1 });
        } else {
          // Ensure hasMore is set to false if we can't load more
          set({ hasMore: false });
        }
      },

      /**
       * Reset pagination state
       * Called automatically when filters change
       */
      resetPagination: () => {
        set({
          currentPage: 1,
          allLoadedProducts: [],
          hasMore: true,
        });
      },

      /**
       * Update price range maximum dynamically
       * Called when products are loaded and max price changes
       */
      updatePriceRangeMax: (maxPrice) => {
        const state = get();
        // Only update if current max is the default (1000)
        if (state.priceRange[1] === 1000 && maxPrice !== 1000) {
          set({ priceRange: [0, maxPrice] });
        }
      },

      // ========================================
      // Computed/Derived State
      // ========================================

      /**
       * Get filtered and sorted products
       * Applies client-side filtering and sorting to loaded products
       */
      getFilteredProducts: () => {
        const state = get();
        let filtered = [...state.allLoadedProducts];

        // Filter by selected materials
        if (state.selectedMaterials.length > 0) {
          filtered = filtered.filter((product) => {
            const productMaterialIds = getProductMaterialIds(product);
            return state.selectedMaterials.some((selectedId) =>
              productMaterialIds.includes(selectedId)
            );
          });
        }

        // Filter by price range
        filtered = filtered.filter((product) => {
          const minPrice = getMinPrice(product);
          return (
            minPrice >= state.priceRange[0] && minPrice <= state.priceRange[1]
          );
        });

        // Sort products
        if (state.sortBy === "price-low") {
          filtered.sort((a, b) => getMinPrice(a) - getMinPrice(b));
        } else if (state.sortBy === "price-high") {
          filtered.sort((a, b) => getMinPrice(b) - getMinPrice(a));
        }
        // Note: 'newest' sorting is handled by server-side sorters (created_at desc)
        // Note: 'popularity' would need view_count or sales data

        return filtered;
      },

      /**
       * Get dynamic maximum price from loaded products
       */
      getMaxPrice: () => {
        const state = get();
        return calculateMaxPrice(state.allLoadedProducts);
      },

      /**
       * Check if any filters are active
       */
      hasActiveFilters: () => {
        const state = get();
        const maxPrice = get().getMaxPrice();
        return (
          state.selectedMaterials.length > 0 ||
          state.priceRange[0] !== 0 ||
          state.priceRange[1] < maxPrice
        );
      },
    }),
    {
      name: "products-storage",
      // Only persist filters, not the products themselves
      partialize: (state) => ({
        selectedMaterials: state.selectedMaterials,
        priceRange: state.priceRange,
        sortBy: state.sortBy,
      }),
    }
  )
);
