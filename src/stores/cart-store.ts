import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  product_id: string;
  product_material_id?: string; // ID from product_materials table
  quantity: number;
  price: number;
  name: string;
  image_url: string;
  material: string;
  sku?: string; // Product SKU
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => set((state) => {
        const existingItem = state.items.find(i => i.product_id === item.product_id);
        if (existingItem) {
          return {
            items: state.items.map(i =>
              i.product_id === item.product_id
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          };
        }
        return { items: [...state.items, item] };
      }),
      
      removeItem: (productId) => set((state) => ({
        items: state.items.filter(i => i.product_id !== productId),
      })),
      
      updateQuantity: (productId, quantity) => set((state) => {
        if (quantity <= 0) {
          return { items: state.items.filter(i => i.product_id !== productId) };
        }
        return {
          items: state.items.map(i =>
            i.product_id === productId ? { ...i, quantity } : i
          ),
        };
      }),
      
      clearCart: () => set({ items: [] }),
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

