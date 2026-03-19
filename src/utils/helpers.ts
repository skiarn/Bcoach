// Helper functions
export const formatTime = (seconds: number): string => {
  // logic
  return `${seconds}s`
}

const FALLBACK_RECORDED_NAME = 'inspelad video'

const formatRecordingTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp)
  const dayPart = date.toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const timePart = date.toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${dayPart} ${timePart}`
}

export const getVideoDisplayName = (rawName?: string, timestamp?: number): string => {
  const normalized = rawName?.trim()
  if (normalized && normalized.toLowerCase() !== FALLBACK_RECORDED_NAME) {
    return normalized
  }

  const safeTimestamp = timestamp ?? Date.now()
  return `Inspelning ${formatRecordingTimestamp(safeTimestamp)}`
}