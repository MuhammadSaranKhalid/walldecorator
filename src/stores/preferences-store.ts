import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface PreferencesStore {
  language: 'English' | 'Spanish' | 'French';
  currency: 'Dollar' | 'Euro' | 'Rupees';
  setLanguage: (lang: 'English' | 'Spanish' | 'French') => void;
  setCurrency: (curr: 'Dollar' | 'Euro' | 'Rupees') => void;
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      language: 'English',
      currency: 'Dollar',
      setLanguage: (language) => set({ language }),
      setCurrency: (currency) => set({ currency }),
    }),
    {
      name: 'preferences-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

