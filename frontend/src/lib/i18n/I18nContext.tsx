import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Locale } from './translations'
import { t } from './translations'

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  translate: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

function getBrowserLocale(): Locale {
  const lang = navigator.language
  if (lang.startsWith('pt')) return 'pt-BR'
  return 'en-US'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('locale') as Locale | null
    return saved ?? getBrowserLocale()
  })

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
  }, [])

  const translate = useCallback(
    (key: string, params?: Record<string, string | number>) => t(locale, key as any, params),
    [locale],
  )

  return (
    <I18nContext.Provider value={{ locale, setLocale, translate }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider')
  return ctx
}