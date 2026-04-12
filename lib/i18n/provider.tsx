'use client'

import { useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n, { getLanguageDir } from './config'

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Sync <html> dir and lang attributes when language changes
  useEffect(() => {
    const syncHtmlAttrs = (lng: string) => {
      document.documentElement.lang = lng
      document.documentElement.dir = getLanguageDir(lng)
    }

    syncHtmlAttrs(i18n.language)
    i18n.on('languageChanged', syncHtmlAttrs)
    return () => {
      i18n.off('languageChanged', syncHtmlAttrs)
    }
  }, [])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
