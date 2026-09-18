import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getLanguage, setLanguage as persistLanguage, Language } from '../data'
import { en } from './translations/en'
import { de } from './translations/de'
import { fr } from './translations/fr'
import { it } from './translations/it'

export type TranslationKey = keyof typeof en

const TRANSLATIONS: Record<Language, Record<TranslationKey, string>> = { en, de, fr, it }

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match
  )
}

type I18nContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    getLanguage().then(setLanguageState)
  }, [])

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
    persistLanguage(next)
  }, [])

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      interpolate(TRANSLATIONS[language][key] ?? TRANSLATIONS.en[key] ?? key, params),
    [language]
  )

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider')
  return ctx
}
