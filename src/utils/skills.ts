import { DEFAULT_LOCALE, generatedSkills } from '../generated/catalog.ts'
import { getCurrentLocale } from './locale.ts'
import { normalizeSportId } from './sports.ts'

export interface Skill {
  id: string
  name: string
  sportId: string
  // Legacy alias kept for backward compatibility in existing components and metadata.
  type: string
  videoUrls: string[]
  advice: string[]
  nextSteps: string[]
}

function resolveSkillText(entry: (typeof generatedSkills)[number], locale: string) {
  const preferredLocale = locale.trim().toLowerCase() || DEFAULT_LOCALE
  return entry.texts[preferredLocale] ?? entry.texts[DEFAULT_LOCALE] ?? Object.values(entry.texts)[0]
}

function toSkill(entry: (typeof generatedSkills)[number], locale: string): Skill {
  const text = resolveSkillText(entry, locale)
  return {
    id: entry.id,
    name: text?.name ?? entry.id,
    sportId: entry.sportId,
    type: entry.sportId,
    videoUrls: entry.videoUrls,
    advice: text?.advice ?? [],
    nextSteps: text?.nextSteps ?? [],
  }
}

function getAllSkills(locale = DEFAULT_LOCALE): Skill[] {
  return generatedSkills
    .filter((entry) => entry.enabled)
    .map((entry) => toSkill(entry, locale))
}

const ACTIVE_LOCALE = getCurrentLocale()

export const skills: Skill[] = getAllSkills(ACTIVE_LOCALE)

export function getSkillsBySport(sportId: string, locale = ACTIVE_LOCALE): Skill[] {
  const normalized = normalizeSportId(sportId) ?? sportId
  return getAllSkills(locale).filter((skill) => skill.sportId === normalized)
}

export function findSkill(skillName?: string | null, sportIdOrType?: string | null, locale = ACTIVE_LOCALE): Skill | undefined {
  const name = skillName?.trim()
  if (!name) {
    return undefined
  }

  const localizedSkills = getAllSkills(locale)
  const normalizedSportId = normalizeSportId(sportIdOrType)
  if (!normalizedSportId) {
    return localizedSkills.find((skill) => skill.name === name)
  }

  return localizedSkills.find((skill) => skill.name === name && skill.sportId === normalizedSportId)
}

export function findSkillById(skillId?: string | null, locale = ACTIVE_LOCALE): Skill | undefined {
  const normalizedId = skillId?.trim()
  if (!normalizedId) {
    return undefined
  }

  const entry = generatedSkills.find((skill) => skill.id === normalizedId && skill.enabled)
  if (!entry) {
    return undefined
  }

  return toSkill(entry, locale)
}
