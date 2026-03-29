import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppNav from '../components/AppNav.tsx'
import Controls from '../components/Controls.tsx'
import EditTimeline from '../components/EditTimeline.tsx'
import EditProgressOverlay from '../components/EditProgressOverlay.tsx'
import { useVideoSegments } from '../hooks/useVideoSegments.ts'
import { applyVideoEdits } from '../utils/videoEditExport.ts'
import { useI18n } from '../i18n/I18nProvider.tsx'
import {
  getVideoLibraryRecord,
  upsertVideoRecord,
  VideoLibraryRecord,
} from '../services/videoLibrary.ts'

function VideoEditor(): JSX.Element {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { videoId } = useParams<{ videoId: string }>()

  const videoRef = useRef<HTMLVideoElement>(null)

  const [record, setRecord] = useState<VideoLibraryRecord | null>(null)
  const [videoUrl, setVideoUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)

  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [saveError, setSaveError] = useState<string | null>(null)

  const { segments, addSegment, updateSegment, removeSegment, clearSegments } = useVideoSegments()

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
  }, [videoId, t])

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

  const handleSpeedChange = (speed: number) => {
    if (!videoRef.current) return
    videoRef.current.playbackRate = speed
    setPlaybackRate(speed)
  }

  const handleSave = async (replaceOriginal: boolean) => {
    if (!record || !record.blob) return
    if (segments.length === 0) {
      setSaveError(t('editor.error.noSegments'))
      return
    }

    setSaveError(null)
    setIsProcessing(true)
    setProgress(0)

    try {
      const edited = await applyVideoEdits(
        record.blob,
        record.name,
        segments,
        duration,
        setProgress
      )

      if (replaceOriginal) {
        const updatedRecord: VideoLibraryRecord = {
          ...record,
          blob: edited,
          size: edited.size,
          mimeType: edited.type || 'video/mp4',
          lastModified: Date.now(),
        }
        await upsertVideoRecord(updatedRecord)
      } else {
        const newName = record.name.replace(/(\.[^.]+)?$/, `-edited$1`)
        const newRecord: VideoLibraryRecord = {
          id: `video-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: newName,
          mimeType: edited.type || 'video/mp4',
          size: edited.size,
          createdAt: Date.now(),
          source: 'imported',
          metadata: record.metadata,
          blob: edited,
        }
        await upsertVideoRecord(newRecord)
      }

      navigate('/history')
    } catch (err) {
      const message = err instanceof Error ? err.message : t('editor.error.exportFailed')
      setSaveError(message)
    } finally {
      setIsProcessing(false)
      setProgress(0)
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
      {isProcessing && <EditProgressOverlay progress={progress} />}

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
        <div className="video-editor__player-wrap">
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
            <Controls
              isPlaying={isPlaying}
              playbackRate={playbackRate}
              currentTime={currentTime}
              duration={duration}
              onPlay={handlePlay}
              onPause={handlePause}
              onSpeedChange={handleSpeedChange}
              onSeek={handleSeek}
              videoLoaded={true}
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
              className="video-editor__action-btn video-editor__action-btn--clear"
              onClick={clearSegments}
              disabled={segments.length === 0 || isProcessing}
            >
              ✕ {t('editor.clearSegments')}
            </button>

            <button
              type="button"
              className="video-editor__action-btn video-editor__action-btn--save-new"
              onClick={() => void handleSave(false)}
              disabled={segments.length === 0 || isProcessing}
            >
              💾 {t('editor.saveNew')}
            </button>

            <button
              type="button"
              className="video-editor__action-btn video-editor__action-btn--replace"
              onClick={() => void handleSave(true)}
              disabled={segments.length === 0 || isProcessing}
            >
              🔄 {t('editor.replace')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoEditor
