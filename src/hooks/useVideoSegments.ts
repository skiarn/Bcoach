import { useState, useCallback } from 'react'
import { VideoSegment, SegmentAction } from '../types/editing.ts'

function generateId(): string {
  return `seg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function useVideoSegments() {
  const [segments, setSegments] = useState<VideoSegment[]>([])

  const addSegment = useCallback((startTime: number, endTime: number): string => {
    const id = generateId()
    setSegments((prev) => {
      const next: VideoSegment[] = [
        ...prev,
        { id, startTime, endTime, action: 'remove' },
      ]
      return next.sort((a, b) => a.startTime - b.startTime)
    })
    return id
  }, [])

  const updateSegment = useCallback(
    (
      id: string,
      changes: Partial<Pick<VideoSegment, 'startTime' | 'endTime' | 'action' | 'speedFactor'>>
    ) => {
      setSegments((prev) =>
        prev
          .map((seg) => (seg.id === id ? { ...seg, ...changes } : seg))
          .sort((a, b) => a.startTime - b.startTime)
      )
    },
    []
  )

  const removeSegment = useCallback((id: string) => {
    setSegments((prev) => prev.filter((seg) => seg.id !== id))
  }, [])

  const clearSegments = useCallback(() => {
    setSegments([])
  }, [])

  return { segments, addSegment, updateSegment, removeSegment, clearSegments }
}
