import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppNav from '../components/AppNav.tsx'
import PlaybackToolbar from '../components/PlaybackToolbar.tsx'
import EditTimeline from '../components/EditTimeline.tsx'
import { useVideoSegments } from '../hooks/useVideoSegments.ts'
import { useI18n } from '../i18n/I18nProvider.tsx'
import {
  getVideoLibraryRecord,
  upsertVideoRecord,
  VideoLibraryRecord,
} from '../services/videoLibrary.ts'
import { EmbeddedAnalysisMetadataV3, PlaybackEditSegment } from '../types/analysis.ts'
import { createEmptyMetadata, normalizeEmbeddedAnalysisMetadata } from '../utils/analysisMetadata.ts'

function VideoEditor(): JSX.Element {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { videoId } = useParams<{ videoId: string }>()

  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [record, setRecord] = useState<VideoLibraryRecord | null>(null)
  const [videoUrl, setVideoUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const basePlaybackRate = 1

  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const { segments, addSegment, updateSegment, removeSegment, replaceSegments } = useVideoSegments()

  useEffect(() => {
    if (!videoId) {
      setLoadError(t('editor.error.noVideoId'))
      setIsLoading(false)
      return
    }

    let objectUrl = ''
    let cancelled = false

    const load = async () => {
      try {
        const rec = await getVideoLibraryRecord(videoId)
        if (cancelled) return
        if (!rec) {
          setLoadError(t('editor.error.notFound'))
          return
        }
        setRecord(rec)
        if (rec.metadata?.schemaVersion === 3) {
          replaceSegments(
            (rec.metadata.playbackEdits ?? []).map((segment) => ({
              id: segment.id,
              startTime: segment.startTime,
              endTime: segment.endTime,
              action: segment.action,
              speedFactor: segment.speedFactor,
            }))
          )
        }
        objectUrl = URL.createObjectURL(rec.blob)
        setVideoUrl(objectUrl)
      } catch {
        if (!cancelled) setLoadError(t('editor.error.loadFailed'))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [videoId, t, replaceSegments])

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current)
    }

    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange)
    }
  }, [])

  const handlePlay = () => {
    if (!videoRef.current) return
    void videoRef.current.play().catch(() => setIsPlaying(false))
  }

  const handlePause = () => {
    videoRef.current?.pause()
  }

  const handleSeek = (time: number) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = time
    setCurrentTime(time)
  }

  const handleToggleFullscreen = async () => {
    if (!containerRef.current) {
      return
    }

    try {
      if (document.fullscreenElement === containerRef.current) {
        await document.exitFullscreen()
      } else {
        await containerRef.current.requestFullscreen()
      }
    } catch {
      // Ignore fullscreen API failures on unsupported devices.
    }
  }

  const runtimePlaybackEdits = useMemo(
    () => segments.filter((segment) => segment.action === 'remove' || segment.action === 'speed'),
    [segments]
  )

  useEffect(() => {
    if (!videoRef.current) {
      return
    }

    const removeSegment = runtimePlaybackEdits.find(
      (segment) =>
        segment.action === 'remove' &&
        currentTime >= segment.startTime &&
        currentTime < segment.endTime
    )

    if (removeSegment) {
      const seekTarget = Math.min(removeSegment.endTime + 0.01, videoRef.current.duration || removeSegment.endTime)
      videoRef.current.currentTime = seekTarget
      setCurrentTime(seekTarget)
      return
    }

    const activeSpeedSegment = runtimePlaybackEdits.find(
      (segment) =>
        segment.action === 'speed' &&
        segment.speedFactor &&
        currentTime >= segment.startTime &&
        currentTime <= segment.endTime
    )

    videoRef.current.playbackRate = activeSpeedSegment?.speedFactor ?? basePlaybackRate
  }, [currentTime, runtimePlaybackEdits, basePlaybackRate])

  const handleSaveMetadataEdits = async () => {
    if (!record) return

    setSaveError(null)
    setIsSaving(true)

    try {
      const normalizedMetadata =
        normalizeEmbeddedAnalysisMetadata(record.metadata) ??
        (createEmptyMetadata() as EmbeddedAnalysisMetadataV3)

      const playbackEdits: PlaybackEditSegment[] = runtimePlaybackEdits.map((segment) => {
        const action = segment.action === 'speed' ? 'speed' : 'remove'

        return {
          id: segment.id,
          startTime: segment.startTime,
          endTime: segment.endTime,
          action,
          speedFactor: action === 'speed' ? segment.speedFactor : undefined,
        }
      })

      const metadata: EmbeddedAnalysisMetadataV3 = {
        ...normalizedMetadata,
        schemaVersion: 3,
        savedAt: Date.now(),
        playbackEdits,
      }

      const updatedRecord: VideoLibraryRecord = {
        ...record,
        metadata,
        lastModified: Date.now(),
      }

      await upsertVideoRecord(updatedRecord)
      navigate('/history')
    } catch (err) {
      const message = err instanceof Error ? err.message : t('editor.error.exportFailed')
      setSaveError(message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="video-editor">
        <AppNav />
        <p className="video-editor__loading">{t('common.loading')}</p>
      </div>
    )
  }

  if (loadError || !record) {
    return (
      <div className="video-editor">
        <AppNav />
        <div className="video-editor__error">
          <p>{loadError ?? t('editor.error.notFound')}</p>
          <button type="button" className="history-action-btn" onClick={() => navigate('/history')}>
            {t('common.back')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="video-editor">
      <AppNav />

      <header className="page-header">
        <div className="video-editor__title-row">
          <button
            type="button"
            className="video-editor__back-btn"
            onClick={() => navigate('/history')}
          >
            ← {t('common.back')}
          </button>
          <h1 className="video-editor__title">{t('editor.title', { name: record.name })}</h1>
        </div>
        <p className="video-editor__subtitle">{t('editor.subtitle')}</p>
      </header>

      <div className="video-editor__body">
        {/* Video player */}
        <div ref={containerRef} className={`video-editor__player-wrap ${isFullscreen ? 'is-fullscreen' : ''}`}>
          <video
            ref={videoRef}
            src={videoUrl}
            style={{ width: '100%', height: 'auto', display: 'block' }}
            playsInline
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration
              if (Number.isFinite(d) && d > 0) setDuration(d)
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
          <div className="video-controls-overlay">
            <PlaybackToolbar
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              onPlay={handlePlay}
              onPause={handlePause}
              onSeek={handleSeek}
              videoLoaded={true}
              onToggleFullscreen={handleToggleFullscreen}
              isFullscreen={isFullscreen}
            />
          </div>
        </div>

        {/* Timeline editor */}
        <div className="video-editor__edit-panel">
          {duration > 0 && (
            <EditTimeline
              duration={duration}
              currentTime={currentTime}
              segments={segments}
              onAddSegment={addSegment}
              onUpdateSegment={updateSegment}
              onRemoveSegment={removeSegment}
              onSeek={handleSeek}
            />
          )}

          {saveError && <p className="video-editor__error-msg">{saveError}</p>}

          <div className="video-editor__actions">
            <button
              type="button"
              className="video-editor__action-btn video-editor__action-btn--replace"
              onClick={() => void handleSaveMetadataEdits()}
              disabled={isSaving}
            >
              {isSaving ? t('analyze.saving') : `💾 ${t('analyze.quickSave')}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoEditor
