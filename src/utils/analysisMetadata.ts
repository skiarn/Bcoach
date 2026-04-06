import {
  AnalysisSegment,
  EmbeddedAnalysisMetadata,
  EmbeddedAnalysisMetadataV3,
  FeedbackPin,
  SegmentFeedback,
} from '../types/analysis.ts'
import { findSkill, findSkillById } from './skills.ts'
import { normalizeSportId } from './sports.ts'

function normalizeString(value?: string | null): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function normalizeStringList(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return []
  }

  return values
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function normalizeTimestamp(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, value)
}

function normalizeScore(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined
  }

  const rounded = Math.round(value)
  if (rounded < 1 || rounded > 5) {
    return undefined
  }

  return rounded
}

function normalizeFeedbackPins(pins: unknown): FeedbackPin[] {
  if (!Array.isArray(pins)) {
    return []
  }

  return pins
    .filter((pin): pin is Partial<FeedbackPin> => Boolean(pin) && typeof pin === 'object')
    .map((pin, index) => {
      const id = normalizeString(pin.id) ?? `pin-${index + 1}`
      const text = normalizeString(pin.text) ?? ''
      const timeOffset = normalizeTimestamp(pin.timeOffset)
      const tag = normalizeString(pin.tag)

      return {
        id,
        timeOffset,
        text,
        tag,
      }
    })
    .filter((pin) => pin.text.length > 0)
}

function normalizeSegmentFeedback(feedback: unknown): SegmentFeedback {
  if (!feedback || typeof feedback !== 'object') {
    return {
      checklist: [],
      notes: [],
      nextSteps: [],
    }
  }

  const candidate = feedback as Partial<SegmentFeedback>
  const pins = normalizeFeedbackPins(candidate.pins)

  return {
    checklist: normalizeStringList(candidate.checklist),
    notes: normalizeStringList(candidate.notes),
    nextSteps: normalizeStringList(candidate.nextSteps),
    score: normalizeScore(candidate.score),
    pins: pins.length > 0 ? pins : undefined,
  }
}

function normalizeAnalysisSegments(segments: unknown): AnalysisSegment[] {
  if (!Array.isArray(segments)) {
    return []
  }

  return segments
    .filter((segment): segment is Partial<AnalysisSegment> => Boolean(segment) && typeof segment === 'object')
    .map((segment, index) => {
      const startTime = normalizeTimestamp(segment.startTime)
      const endTime = normalizeTimestamp(segment.endTime)
      const normalizedStart = Math.min(startTime, endTime)
      const normalizedEnd = Math.max(startTime, endTime)
      const attemptIndex =
        typeof segment.attemptIndex === 'number' && Number.isFinite(segment.attemptIndex)
          ? Math.max(1, Math.round(segment.attemptIndex))
          : index + 1

      return {
        id: normalizeString(segment.id) ?? `seg-${index + 1}`,
        startTime: normalizedStart,
        endTime: normalizedEnd,
        skillId: normalizeString(segment.skillId),
        skillName: normalizeString(segment.skillName),
        attemptIndex,
        feedback: normalizeSegmentFeedback(segment.feedback),
      }
    })
}

function flattenSegmentsToLegacyLists(segments: AnalysisSegment[]): Pick<EmbeddedAnalysisMetadataV3, 'feedback' | 'nextSteps'> {
  const feedback = new Set<string>()
  const nextSteps = new Set<string>()

  segments.forEach((segment) => {
    segment.feedback.checklist.forEach((item) => feedback.add(item))
    segment.feedback.notes.forEach((item) => feedback.add(item))
    segment.feedback.nextSteps.forEach((item) => nextSteps.add(item))
  })

  return {
    feedback: Array.from(feedback),
    nextSteps: Array.from(nextSteps),
  }
}

function buildFallbackSegmentFromLegacy(metadata: EmbeddedAnalysisMetadata): AnalysisSegment[] {
  const checklist = normalizeStringList(metadata.feedback)
  const nextSteps = normalizeStringList(metadata.nextSteps)

  if (checklist.length === 0 && nextSteps.length === 0) {
    return []
  }

  return [
    {
      id: 'seg-1',
      startTime: 0,
      endTime: 0,
      skillId: normalizeString(metadata.skillId),
      skillName: normalizeString(metadata.skillName),
      attemptIndex: 1,
      feedback: {
        checklist,
        notes: [],
        nextSteps,
      },
    },
  ]
}

export function createEmptyMetadata(): EmbeddedAnalysisMetadata {
  return {
    schemaVersion: 3,
    savedAt: 0,
    feedback: [],
    nextSteps: [],
    shapes: [],
    analysisSegments: [],
  }
}

export function toV3Metadata(metadata?: EmbeddedAnalysisMetadata | null): EmbeddedAnalysisMetadataV3 | undefined {
  return normalizeEmbeddedAnalysisMetadata(metadata)
}

export function normalizeEmbeddedAnalysisMetadata(
  metadata?: EmbeddedAnalysisMetadata | null
): EmbeddedAnalysisMetadataV3 | undefined {
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

  const normalizedSegments = metadata.schemaVersion === 3
    ? normalizeAnalysisSegments(metadata.analysisSegments)
    : buildFallbackSegmentFromLegacy(metadata)
  const legacyLists = flattenSegmentsToLegacyLists(normalizedSegments)
  const directFeedback = normalizeStringList(metadata.feedback)
  const directNextSteps = normalizeStringList(metadata.nextSteps)

  return {
    schemaVersion: 3,
    savedAt: Number.isFinite(metadata.savedAt) ? metadata.savedAt : 0,
    sportId,
    skillId,
    skillName: resolvedSkill?.name ?? skillName,
    skillType: sportId,
    sourceVideoName,
    feedback: directFeedback.length > 0 ? directFeedback : legacyLists.feedback,
    nextSteps: directNextSteps.length > 0 ? directNextSteps : legacyLists.nextSteps,
    shapes: Array.isArray(metadata.shapes) ? metadata.shapes : [],
    analysisSegments: normalizedSegments,
  }
}

export function deriveLegacyFeedbackFromSegments(segments: AnalysisSegment[]): string[] {
  return flattenSegmentsToLegacyLists(segments).feedback
}

export function deriveLegacyNextStepsFromSegments(segments: AnalysisSegment[]): string[] {
  return flattenSegmentsToLegacyLists(segments).nextSteps
}
