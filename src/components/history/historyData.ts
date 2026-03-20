import { EmbeddedAnalysisMetadata } from '../../types/analysis.ts'
import { VideoLibraryListItem } from '../../services/videoLibrary.ts'

export type DashboardRange = '7d' | '30d' | 'all'

export interface HistoryTrendPoint {
  dayKey: string
  label: string
  feedback: number
  sessions: number
  nextSteps: number
}

export interface HistorySkillProgressItem {
  typeLabel: string
  skillName: string
  sessions: number
  feedbackTotal: number
  nextStepsTotal: number
  latestTimestamp: number
}

export interface DashboardStats {
  rangeLabel: string
  totalSessions: number
  totalFeedbackPoints: number
  totalNextSteps: number
  avgFeedbackPerSession: number
  avgNextStepsPerSession: number
  streakDays: number
  xp: number
  currentLevel: number
  levelProgress: number
  nextLevelTarget: number
  badges: Array<{ id: string; label: string; unlocked: boolean }>
  topFeedbackTopics: Array<[string, number]>
  maxTopicCount: number
  trendPoints: HistoryTrendPoint[]
  trendMaxFeedback: number
  skillProgress: HistorySkillProgressItem[]
}

export function getDayKey(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getSkillTypeLabel(skillType?: string): string {
  if (skillType === 'beachvolley') return 'Beachvolley'
  if (skillType === 'volleyboll') return 'Volleyboll'
  return 'Utan vald sport'
}

function getRangeStartTimestamp(range: DashboardRange, nowTimestamp: number): number {
  if (range === '7d') return nowTimestamp - (7 * 24 * 60 * 60 * 1000)
  if (range === '30d') return nowTimestamp - (30 * 24 * 60 * 60 * 1000)
  return 0
}

function metadataOrEmpty(metadata?: EmbeddedAnalysisMetadata): EmbeddedAnalysisMetadata {
  return metadata ?? {
    schemaVersion: 1,
    savedAt: 0,
    feedback: [],
    nextSteps: [],
    shapes: [],
  }
}

export function computeDashboardStats(items: VideoLibraryListItem[], range: DashboardRange): DashboardStats {
  const nowTimestamp = Date.now()
  const rangeStartTimestamp = getRangeStartTimestamp(range, nowTimestamp)

  const dashboardItems = range === 'all'
    ? items
    : items.filter((item) => item.createdAt >= rangeStartTimestamp)

  const sortedItems = [...dashboardItems].sort((a, b) => a.createdAt - b.createdAt)
  const totalSessions = dashboardItems.length
  const totalFeedbackPoints = dashboardItems.reduce(
    (sum, item) => sum + metadataOrEmpty(item.metadata).feedback.length,
    0
  )
  const totalNextSteps = dashboardItems.reduce(
    (sum, item) => sum + metadataOrEmpty(item.metadata).nextSteps.length,
    0
  )

  const avgFeedbackPerSession = totalSessions > 0 ? totalFeedbackPoints / totalSessions : 0
  const avgNextStepsPerSession = totalSessions > 0 ? totalNextSteps / totalSessions : 0
  const rangeLabel = range === '7d' ? '7 dagar' : range === '30d' ? '30 dagar' : 'Alla'

  const sessionDaySet = new Set(dashboardItems.map((item) => getDayKey(item.createdAt)))
  let streakDays = 0
  const streakDate = new Date()
  while (true) {
    const key = getDayKey(streakDate.getTime())
    if (!sessionDaySet.has(key)) break
    streakDays += 1
    streakDate.setDate(streakDate.getDate() - 1)
  }

  const xp = (totalSessions * 100) + (totalFeedbackPoints * 5) + (totalNextSteps * 15)
  const xpPerLevel = 500
  const currentLevel = Math.max(1, Math.floor(xp / xpPerLevel) + 1)
  const currentLevelFloor = (currentLevel - 1) * xpPerLevel
  const nextLevelTarget = currentLevel * xpPerLevel
  const levelProgress = Math.max(0, Math.min(100, ((xp - currentLevelFloor) / xpPerLevel) * 100))

  const weeklySessions = dashboardItems.filter((item) => item.createdAt >= (nowTimestamp - (7 * 24 * 60 * 60 * 1000))).length
  const badges = [
    { id: 'first', label: 'Forsta passet', unlocked: totalSessions >= 1 },
    { id: 'weekly', label: 'Veckans slitare', unlocked: weeklySessions >= 5 },
    { id: 'streak', label: 'Streak 3 dagar', unlocked: streakDays >= 3 },
    { id: 'reflect', label: 'Djup analys', unlocked: avgFeedbackPerSession >= 4 },
    { id: 'veteran', label: 'Video-veteran', unlocked: totalSessions >= 15 },
  ]

  const feedbackTopicCount = new Map<string, number>()
  dashboardItems.forEach((item) => {
    metadataOrEmpty(item.metadata).feedback.forEach((feedback) => {
      const key = feedback.trim()
      if (!key) return
      feedbackTopicCount.set(key, (feedbackTopicCount.get(key) ?? 0) + 1)
    })
  })

  const topFeedbackTopics = Array.from(feedbackTopicCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const maxTopicCount = topFeedbackTopics[0]?.[1] ?? 1

  const trendByDay = new Map<string, HistoryTrendPoint>()
  sortedItems.forEach((item) => {
    const dayKey = getDayKey(item.createdAt)
    const metadata = metadataOrEmpty(item.metadata)
    const existing = trendByDay.get(dayKey)
    const label = new Date(item.createdAt).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })

    if (existing) {
      existing.feedback += metadata.feedback.length
      existing.sessions += 1
      existing.nextSteps += metadata.nextSteps.length
      return
    }

    trendByDay.set(dayKey, {
      dayKey,
      label,
      feedback: metadata.feedback.length,
      sessions: 1,
      nextSteps: metadata.nextSteps.length,
    })
  })

  const trendPoints = Array.from(trendByDay.values())
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey))
    .slice(-8)
  const trendMaxFeedback = trendPoints.reduce((max, point) => Math.max(max, point.feedback), 1)

  const skillProgressMap = new Map<string, HistorySkillProgressItem>()
  dashboardItems.forEach((item) => {
    const metadata = metadataOrEmpty(item.metadata)
    const typeLabel = getSkillTypeLabel(metadata.skillType)
    const skillName = metadata.skillName?.trim() || 'Utan vald teknik'
    const key = `${typeLabel}::${skillName}`
    const existing = skillProgressMap.get(key)

    if (existing) {
      existing.sessions += 1
      existing.feedbackTotal += metadata.feedback.length
      existing.nextStepsTotal += metadata.nextSteps.length
      existing.latestTimestamp = Math.max(existing.latestTimestamp, item.createdAt)
      return
    }

    skillProgressMap.set(key, {
      typeLabel,
      skillName,
      sessions: 1,
      feedbackTotal: metadata.feedback.length,
      nextStepsTotal: metadata.nextSteps.length,
      latestTimestamp: item.createdAt,
    })
  })

  const skillProgress = Array.from(skillProgressMap.values())
    .sort((a, b) => b.sessions - a.sessions || b.latestTimestamp - a.latestTimestamp)

  return {
    rangeLabel,
    totalSessions,
    totalFeedbackPoints,
    totalNextSteps,
    avgFeedbackPerSession,
    avgNextStepsPerSession,
    streakDays,
    xp,
    currentLevel,
    levelProgress,
    nextLevelTarget,
    badges,
    topFeedbackTopics,
    maxTopicCount,
    trendPoints,
    trendMaxFeedback,
    skillProgress,
  }
}

export function groupItemsBySkill(items: VideoLibraryListItem[]): Record<string, Record<string, VideoLibraryListItem[]>> {
  return items.reduce<Record<string, Record<string, VideoLibraryListItem[]>>>((acc, item) => {
    const typeKey = getSkillTypeLabel(item.metadata?.skillType)
    const skillKey = item.metadata?.skillName?.trim() || 'Utan vald teknik'

    if (!acc[typeKey]) {
      acc[typeKey] = {}
    }

    if (!acc[typeKey][skillKey]) {
      acc[typeKey][skillKey] = []
    }

    acc[typeKey][skillKey].push(item)
    return acc
  }, {})
}
