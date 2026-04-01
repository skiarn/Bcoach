// Helper functions
export const formatTime = (seconds: number): string => {
  // logic
  return `${seconds}s`
}

const FALLBACK_RECORDED_NAME = 'inspelad video'

interface VideoNameOptions {
  timestamp?: number
  sportLabel?: string
  skillName?: string
  locale?: string
}

function extractRecordingTimestamp(rawName?: string): number | undefined {
  if (!rawName) return undefined
  const match = rawName.match(/recording-(\d{10,})/i)
  if (!match) return undefined

  const parsed = Number(match[1])
  return Number.isFinite(parsed) ? parsed : undefined
}

const formatRecordingTimestamp = (timestamp: number, locale = 'sv-SE'): string => {
  const date = new Date(timestamp)
  const dayPart = date.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const timePart = date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${dayPart} ${timePart}`
}

export const getVideoDisplayName = (rawName?: string, options?: VideoNameOptions): string => {
  const normalized = rawName?.trim()

  const recordingTimestamp = extractRecordingTimestamp(normalized)
  const isFallback = !normalized || normalized.toLowerCase() === FALLBACK_RECORDED_NAME
  const shouldFormatAsRecording = isFallback || Boolean(recordingTimestamp)

  if (normalized && !shouldFormatAsRecording) {
    return normalized
  }

  const safeTimestamp = recordingTimestamp ?? options?.timestamp ?? Date.now()
  const localeTag = options?.locale === 'en'
    ? 'en-US'
    : options?.locale === 'es'
      ? 'es-ES'
      : 'sv-SE'

  const baseLabel = options?.locale === 'en'
    ? 'Recording'
    : options?.locale === 'es'
      ? 'Grabacion'
      : 'Inspelning'

  const context: string[] = []
  if (options?.sportLabel?.trim()) {
    context.push(options.sportLabel.trim())
  }
  if (options?.skillName?.trim()) {
    context.push(options.skillName.trim())
  }

  const contextSuffix = context.length > 0 ? ` - ${context.join(' - ')}` : ''
  return `${baseLabel} ${formatRecordingTimestamp(safeTimestamp, localeTag)}${contextSuffix}`
}