import { EmbeddedAnalysisMetadata } from '../types/analysis.ts'
import { findSkill, findSkillById } from './skills.ts'
import { normalizeSportId } from './sports.ts'

function normalizeString(value?: string | null): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function createEmptyMetadata(): EmbeddedAnalysisMetadata {
  return {
    schemaVersion: 2,
    savedAt: 0,
    feedback: [],
    nextSteps: [],
    shapes: [],
  }
}

export function normalizeEmbeddedAnalysisMetadata(
  metadata?: EmbeddedAnalysisMetadata | null
): EmbeddedAnalysisMetadata | undefined {
  if (!metadata) {
    return undefined
  }

  const skillName = normalizeString(metadata.skillName)
  const sourceVideoName = normalizeString(metadata.sourceVideoName)

  const normalizedSportId = normalizeSportId(metadata.sportId ?? metadata.skillType)
  const skillFromId = findSkillById(metadata.skillId)
  const skillFromName = findSkill(skillName, normalizedSportId)
  const resolvedSkill = skillFromId ?? skillFromName
  const sportId = resolvedSkill?.sportId ?? normalizedSportId
  const skillId = resolvedSkill?.id ?? normalizeString(metadata.skillId)

  return {
    schemaVersion: 2,
    savedAt: Number.isFinite(metadata.savedAt) ? metadata.savedAt : 0,
    sportId,
    skillId,
    skillName: resolvedSkill?.name ?? skillName,
    skillType: sportId,
    sourceVideoName,
    feedback: Array.isArray(metadata.feedback) ? metadata.feedback.filter((item) => typeof item === 'string') : [],
    nextSteps: Array.isArray(metadata.nextSteps) ? metadata.nextSteps.filter((item) => typeof item === 'string') : [],
    shapes: Array.isArray(metadata.shapes) ? metadata.shapes : [],
  }
}
