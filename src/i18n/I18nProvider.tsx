import { createContext, ReactNode, useContext, useMemo, useState } from 'react'
import { getCurrentLocale, setCurrentLocale } from '../utils/locale.ts'
import { MessageKey, SupportedUiLocale, UI_MESSAGES } from './messages.ts'

type TranslationValues = Record<string, string | number>

interface I18nContextValue {
  locale: SupportedUiLocale
  setLocale: (locale: string) => void
  t: (key: MessageKey, values?: TranslationValues) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function normalizeUiLocale(locale: string): SupportedUiLocale {
  return locale === 'en' ? 'en' : 'sv'
}

function interpolate(template: string, values?: TranslationValues): string {
  if (!values) {
    return template
  }

  return template.replace(/\{(\w+)\}/g, (_, token: string) => {
    const value = values[token]
    return value === undefined ? `{${token}}` : String(value)
  })
}

interface I18nProviderProps {
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps): JSX.Element {
  const [locale, setLocaleState] = useState<SupportedUiLocale>(() => normalizeUiLocale(getCurrentLocale()))

  const setLocale = (nextLocale: string) => {
    const normalized = normalizeUiLocale(setCurrentLocale(nextLocale))
    setLocaleState(normalized)

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      params.set('lang', normalized)
      const query = params.toString()
      const nextPath = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
      window.history.replaceState(window.history.state, '', nextPath)
    }
  }

  const value = useMemo<I18nContextValue>(() => {
    const localeMessages = UI_MESSAGES[locale] ?? UI_MESSAGES.sv

    return {
      locale,
      setLocale,
      t: (key, values) => {
        const template = localeMessages[key] ?? UI_MESSAGES.sv[key] ?? key
        return interpolate(template, values)
      },
    }
  }, [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }

  return context
}
