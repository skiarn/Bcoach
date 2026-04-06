import { useRef, useState, useCallback, useEffect } from 'react'
import { VideoSegment, SpeedFactor } from '../types/editing.ts'
import { useI18n } from '../i18n/I18nProvider.tsx'

interface EditTimelineProps {
  duration: number
  currentTime: number
  segments: VideoSegment[]
  showFeedbackAction?: boolean
  onAddSegment: (startTime: number, endTime: number) => string
  onUpdateSegment: (
    id: string,
    changes: Partial<Pick<VideoSegment, 'startTime' | 'endTime' | 'action' | 'speedFactor'>>
  ) => void
  onRemoveSegment: (id: string) => void
  onSeek: (time: number) => void
}

type DragState =
  | { type: 'create'; startTime: number; endTime: number }
  | { type: 'move-start'; id: string }
  | { type: 'move-end'; id: string }
  | { type: 'move-body'; id: string; pointerOffset: number }
  | null

const MIN_SEGMENT_DURATION = 0.25
const SPEED_OPTIONS: SpeedFactor[] = [1.5, 2, 4]

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 10)
  return `${m}:${s.toString().padStart(2, '0')}.${ms}`
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export default function EditTimeline({
  duration,
  currentTime,
  segments,
  showFeedbackAction = false,
  onAddSegment,
  onUpdateSegment,
  onRemoveSegment,
  onSeek,
}: EditTimelineProps): JSX.Element {
  const { t } = useI18n()
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<DragState>(null)
  const [pendingSegment, setPendingSegment] = useState<{ startTime: number; endTime: number } | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const dragRef = useRef<DragState>(null)

  useEffect(() => {
    dragRef.current = dragState
  }, [dragState])

  const getTimeFromClientX = useCallback(
    (clientX: number): number => {
      const rect = trackRef.current?.getBoundingClientRect()
      if (!rect || duration <= 0) return 0
      const ratio = (clientX - rect.left) / rect.width
      return clamp(ratio * duration, 0, duration)
    },
    [duration]
  )

  const timeToPercent = (t: number): number => (duration > 0 ? (t / duration) * 100 : 0)
  const timelineWidthPx = Math.min(6000, Math.max(640, duration * 8))

  const handleTrackPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return
      const target = e.target as HTMLElement
      if (target.closest('[data-segment]')) return

      e.currentTarget.setPointerCapture(e.pointerId)
      // Start new segments from the paused playhead position to make long-video editing predictable.
      const anchorTime = clamp(currentTime, 0, duration)
      setDragState({ type: 'create', startTime: anchorTime, endTime: anchorTime })
      setPendingSegment({ startTime: anchorTime, endTime: anchorTime })
      setSelectedId(null)
    },
    [currentTime, duration]
  )

  const handleTrackPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const ds = dragRef.current
      if (!ds) return
      const time = getTimeFromClientX(e.clientX)

      if (ds.type === 'create') {
        const start = Math.min(ds.startTime, time)
        const end = Math.max(ds.startTime, time)
        setDragState({ ...ds, endTime: time })
        setPendingSegment({ startTime: start, endTime: end })
      } else if (ds.type === 'move-body') {
        const seg = segments.find((s) => s.id === ds.id)
        if (!seg) return
        const segmentLength = seg.endTime - seg.startTime
        const nextStart = clamp(time - ds.pointerOffset, 0, Math.max(0, duration - segmentLength))
        const nextEnd = nextStart + segmentLength
        onUpdateSegment(ds.id, {
          startTime: parseFloat(nextStart.toFixed(3)),
          endTime: parseFloat(nextEnd.toFixed(3)),
        })
      } else if (ds.type === 'move-start') {
        const seg = segments.find((s) => s.id === ds.id)
        if (!seg) return
        const newStart = clamp(time, 0, seg.endTime - MIN_SEGMENT_DURATION)
        onUpdateSegment(ds.id, { startTime: newStart })
      } else if (ds.type === 'move-end') {
        const seg = segments.find((s) => s.id === ds.id)
        if (!seg) return
        const newEnd = clamp(time, seg.startTime + MIN_SEGMENT_DURATION, duration)
        onUpdateSegment(ds.id, { endTime: newEnd })
      }
    },
    [getTimeFromClientX, segments, onUpdateSegment, duration]
  )

  const handleTrackPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const ds = dragRef.current
      if (!ds) return
      e.currentTarget.releasePointerCapture(e.pointerId)

      if (ds.type === 'create') {
        const time = getTimeFromClientX(e.clientX)
        const start = Math.min(ds.startTime, time)
        const end = Math.max(ds.startTime, time)
        const finalStart = parseFloat(start.toFixed(3))
        const finalEnd = parseFloat(end.toFixed(3))

        if (finalEnd - finalStart >= MIN_SEGMENT_DURATION) {
          const id = onAddSegment(finalStart, finalEnd)
          setSelectedId(id)
        } else {
          onSeek(parseFloat(ds.startTime.toFixed(3)))
        }

        setPendingSegment(null)
      }

      setDragState(null)
    },
    [getTimeFromClientX, onAddSegment, onSeek]
  )

  const handleSegmentPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, id: string, kind: 'handle-start' | 'handle-end' | 'body') => {
      e.stopPropagation()
      const track = e.currentTarget.closest<HTMLElement>('[data-track]')
      track?.setPointerCapture(e.pointerId)
      setSelectedId(id)

      if (kind === 'body') {
        const seg = segments.find((s) => s.id === id)
        if (!seg) return
        const pointerTime = getTimeFromClientX(e.clientX)
        const pointerOffset = clamp(pointerTime - seg.startTime, 0, Math.max(0, seg.endTime - seg.startTime))
        setDragState({ type: 'move-body', id, pointerOffset })
        return
      }

      const type = kind === 'handle-start' ? 'move-start' : 'move-end'
      setDragState({ type, id })
    },
    [getTimeFromClientX, segments]
  )

  const selectedSegment = segments.find((s) => s.id === selectedId) ?? null

  const segmentColor = (seg: VideoSegment): string => {
    if (seg.action === 'remove') return '#ef4444'
    if (seg.action === 'speed') return '#3b82f6'
    if (seg.action === 'feedback') return '#f59e0b'
    return '#22c55e'
  }

  const segmentLabel = (seg: VideoSegment): string => {
    if (seg.action === 'remove') return t('editor.segment.remove')
    if (seg.action === 'speed') return `${seg.speedFactor ?? 2}${t('common.speedSuffix')}`
    if (seg.action === 'feedback') return t('editor.segment.feedback')
    return t('editor.segment.keep')
  }

  return (
    <div className="edit-timeline">
      <p className="edit-timeline__hint">{t('editor.timeline.hint')}</p>

      <div className="edit-timeline__legend">
        {showFeedbackAction && (
          <span className="edit-timeline__legend-item edit-timeline__legend-item--feedback">
            {t('editor.segment.feedback')}
          </span>
        )}
        <span className="edit-timeline__legend-item edit-timeline__legend-item--speed">
          {t('editor.segment.speed')}
        </span>
        <span className="edit-timeline__legend-item edit-timeline__legend-item--remove">
          {t('editor.segment.remove')}
        </span>
      </div>

      <div className="edit-timeline__scroll-wrapper">
        <div
          ref={trackRef}
          data-track
          className="edit-timeline__track"
          style={{ width: `${timelineWidthPx}px` }}
          onPointerDown={handleTrackPointerDown}
          onPointerMove={handleTrackPointerMove}
          onPointerUp={handleTrackPointerUp}
          onPointerCancel={handleTrackPointerUp}
        >
          {/* Playhead */}
          <div
            className="edit-timeline__playhead"
            style={{ left: `${timeToPercent(currentTime)}%` }}
          />

          {/* Pending (dragging) segment */}
          {pendingSegment && (
            <div
              className="edit-timeline__segment edit-timeline__segment--pending"
              style={{
                left: `${timeToPercent(pendingSegment.startTime)}%`,
                width: `${timeToPercent(pendingSegment.endTime) - timeToPercent(pendingSegment.startTime)}%`,
              }}
            />
          )}

          {/* Existing segments */}
          {segments.map((seg) => {
            const left = timeToPercent(seg.startTime)
            const width = timeToPercent(seg.endTime) - timeToPercent(seg.startTime)
            const isSelected = seg.id === selectedId
            return (
              <div
                key={seg.id}
                data-segment={seg.id}
                className={`edit-timeline__segment${isSelected ? ' edit-timeline__segment--selected' : ''}`}
                style={{
                  left: `${left}%`,
                  width: `${Math.max(width, 0.5)}%`,
                  background: segmentColor(seg),
                }}
                onPointerDown={(e) => handleSegmentPointerDown(e, seg.id, 'body')}
              >
                <div
                  className="edit-timeline__handle edit-timeline__handle--start"
                  onPointerDown={(e) => handleSegmentPointerDown(e, seg.id, 'handle-start')}
                />
                <span className="edit-timeline__segment-label">{segmentLabel(seg)}</span>
                <div
                  className="edit-timeline__handle edit-timeline__handle--end"
                  onPointerDown={(e) => handleSegmentPointerDown(e, seg.id, 'handle-end')}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Time markers */}
      <div className="edit-timeline__time-markers">
        <span>0:00</span>
        <span>{formatTime(duration / 2)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Selected segment controls */}
      {selectedSegment && (
        <div className="edit-timeline__segment-controls">
          <p className="edit-timeline__segment-time">
            {t('editor.segment.range', {
              start: formatTime(selectedSegment.startTime),
              end: formatTime(selectedSegment.endTime),
            })}
          </p>

          <div className="edit-timeline__action-row">
            {showFeedbackAction && (
              <button
                type="button"
                className={`edit-timeline__action-btn${selectedSegment.action === 'feedback' ? ' active' : ''}`}
                onClick={() => onUpdateSegment(selectedSegment.id, { action: 'feedback', speedFactor: undefined })}
              >
                💬 {t('editor.segment.feedback')}
              </button>
            )}

            {SPEED_OPTIONS.map((factor) => (
              <button
                key={factor}
                type="button"
                className={`edit-timeline__action-btn${
                  selectedSegment.action === 'speed' && selectedSegment.speedFactor === factor
                    ? ' active'
                    : ''
                }`}
                onClick={() =>
                  onUpdateSegment(selectedSegment.id, { action: 'speed', speedFactor: factor })
                }
              >
                ⚡ {factor}{t('common.speedSuffix')}
              </button>
            ))}

            <button
              type="button"
              className={`edit-timeline__action-btn${selectedSegment.action === 'remove' ? ' active' : ''}`}
              onClick={() => onUpdateSegment(selectedSegment.id, { action: 'remove', speedFactor: undefined })}
            >
              ✂️ {t('editor.segment.remove')}
            </button>

            <button
              type="button"
              className="edit-timeline__action-btn edit-timeline__action-btn--delete"
              onClick={() => {
                onRemoveSegment(selectedSegment.id)
                setSelectedId(null)
              }}
            >
              🗑 {t('editor.segment.delete')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
