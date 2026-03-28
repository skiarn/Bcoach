import { DEFAULT_LOCALE, generatedSports, SUPPORTED_LOCALES } from '../generated/catalog.ts'
import { getCurrentLocale } from './locale.ts'

export type CatalogLocale = typeof SUPPORTED_LOCALES[number]

export interface Sport {
  id: string
  label: string
  enabled: boolean
  aliases?: string[]
}

function normalizeLocale(locale?: string): string {
  const normalized = locale?.trim().toLowerCase()
  return normalized || DEFAULT_LOCALE
}

function resolveSportLabel(sportId: string, locale: string): string {
  const sport = generatedSports.find((entry) => entry.id === sportId)
  if (!sport) {
    return sportId
  }

  const preferred = normalizeLocale(locale)
  return sport.labels[preferred] ?? sport.labels[DEFAULT_LOCALE] ?? Object.values(sport.labels)[0] ?? sportId
}

function toSport(entry: (typeof generatedSports)[number], locale: string): Sport {
  return {
    id: entry.id,
    label: resolveSportLabel(entry.id, locale),
    enabled: entry.enabled,
    aliases: entry.aliases,
  }
}

const ACTIVE_LOCALE = getCurrentLocale()

export const sports: Sport[] = generatedSports.map((entry) => toSport(entry, ACTIVE_LOCALE))

export const DEFAULT_SPORT_ID = sports.find((sport) => sport.enabled)?.id ?? 'beachvolley'

export function getSupportedLocales(): readonly string[] {
  return SUPPORTED_LOCALES
}

export function getEnabledSports(locale = ACTIVE_LOCALE): Sport[] {
  return generatedSports
    .filter((sport) => sport.enabled)
    .map((sport) => toSport(sport, locale))
}

export function normalizeSportId(rawValue?: string | null): string | undefined {
  if (!rawValue) {
    return undefined
  }

  const normalized = rawValue.trim().toLowerCase()
  if (!normalized) {
    return undefined
  }

  const matched = generatedSports.find((sport) => {
    if (sport.id === normalized) {
      return true
    }

    return sport.aliases?.some((alias) => alias.toLowerCase() === normalized)
  })

  return matched?.id
}

export function getSportLabel(sportId?: string | null, locale = ACTIVE_LOCALE): string {
  const normalized = normalizeSportId(sportId)
  if (!normalized) {
    return 'Utan vald sport'
  }

  return resolveSportLabel(normalized, locale)
}

export function getSportOrder(locale = ACTIVE_LOCALE): string[] {
  const labels = getEnabledSports(locale).map((sport) => sport.label)
  return [...labels, 'Utan vald sport']
}
