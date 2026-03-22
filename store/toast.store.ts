import { create } from 'zustand'

export type ToastType = 'gold' | 'red' | 'default'

export type Toast = {
  id: string
  title: string
  subtitle?: string
  icon?: string
  type: ToastType
  duration: number
}

type ToastStore = {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void

  // Helper methods for common toast patterns
  showSuccess: (title: string, subtitle?: string) => void
  showError: (title: string, subtitle?: string) => void
  showInfo: (title: string, subtitle?: string) => void
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Math.random().toString(36).substring(7)
    const newToast: Toast = { id, ...toast }

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }))

    // Auto-remove toast after duration
    setTimeout(() => {
      get().removeToast(id)
    }, toast.duration)
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),

  showSuccess: (title, subtitle) => {
    get().addToast({
      title,
      subtitle,
      icon: '✓',
      type: 'gold',
      duration: 3000,
    })
  },

  showError: (title, subtitle) => {
    get().addToast({
      title,
      subtitle,
      icon: '✕',
      type: 'red',
      duration: 3000,
    })
  },

  showInfo: (title, subtitle) => {
    get().addToast({
      title,
      subtitle,
      icon: 'ℹ',
      type: 'default',
      duration: 3000,
    })
  },
}))
