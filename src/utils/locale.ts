import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../generated/catalog.ts'

const LOCALE_STORAGE_KEY = 'bcoach.locale'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function normalizeLocale(value?: string | null): string {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) {
    return DEFAULT_LOCALE
  }

  return SUPPORTED_LOCALES.includes(normalized) ? normalized : DEFAULT_LOCALE
}

export function getCurrentLocale(explicitLocale?: string): string {
  if (explicitLocale) {
    return normalizeLocale(explicitLocale)
  }

  if (!isBrowser()) {
    return DEFAULT_LOCALE
  }

  const paramsLocale = new URLSearchParams(window.location.search).get('lang')
  if (paramsLocale) {
    const normalizedFromParams = normalizeLocale(paramsLocale)
    localStorage.setItem(LOCALE_STORAGE_KEY, normalizedFromParams)
    return normalizedFromParams
  }

  const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY)
  if (storedLocale) {
    return normalizeLocale(storedLocale)
  }

  const browserLocale = window.navigator.language?.split('-')[0]
  return normalizeLocale(browserLocale)
}

export function setCurrentLocale(locale: string): string {
  const normalized = normalizeLocale(locale)

  if (isBrowser()) {
    localStorage.setItem(LOCALE_STORAGE_KEY, normalized)
  }

  return normalized
}

export function getSupportedLocales(): readonly string[] {
  return SUPPORTED_LOCALES
}
