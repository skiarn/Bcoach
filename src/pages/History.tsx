import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppNav from '../components/AppNav.tsx'
import Controls from '../components/Controls.tsx'
import ShapeOverlay from '../components/ShapeOverlay.tsx'
import VideoFeedbackOverlay from '../components/VideoFeedbackOverlay.tsx'
import HistoryDashboard from '../components/history/HistoryDashboard.tsx'
import HistorySkillGroups from '../components/history/HistorySkillGroups.tsx'
import { computeDashboardStats, DashboardRange, groupItemsBySkill } from '../components/history/historyData.ts'
import { getSportOrder } from '../utils/sports.ts'
import { useI18n } from '../i18n/I18nProvider.tsx'
import Trans from '../components/Trans.tsx'
import {
  deleteVideoLibraryRecord,
  getVideoLibraryRecord,
  hydrateRecordMetadata,
  listVideoLibraryItems,
  VideoLibraryListItem,
  VideoLibraryRecord,
} from '../services/videoLibrary.ts'
import { AnalysisSegment, PlaybackEditSegment } from '../types/analysis.ts'

function formatDate(timestamp: number, locale: string): string {
  return new Date(timestamp).toLocaleDateString(locale === 'en' ? 'en-US' : 'sv-SE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function History(): JSX.Element {
  const { t, locale } = useI18n()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<VideoLibraryListItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<VideoLibraryRecord | null>(null)
  const [selectedUrl, setSelectedUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardRange, setDashboardRange] = useState<DashboardRange>('30d')
  const historyView = searchParams.get('view') === 'insights' ? 'insights' : 'videos'

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [basePlaybackRate, setBasePlaybackRate] = useState(1)
  const [overlayWidth, setOverlayWidth] = useState(0)
  const [overlayHeight, setOverlayHeight] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [followPlayback, setFollowPlayback] = useState(true)
  const [isVideoFeedbackOverlayEnabled, setIsVideoFeedbackOverlayEnabled] = useState(true)
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null)

  const refreshItems = async () => {
    setIsLoading(true)
    try {
      const nextItems = await listVideoLibraryItems()
      setItems(nextItems)
      if (!selectedId && nextItems.length > 0) {
        setSelectedId(nextItems[0].id)
      }
      if (selectedId && !nextItems.some((item) => item.id === selectedId)) {
        setSelectedId(nextItems[0]?.id ?? null)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refreshItems()
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setSelectedRecord(null)
      setSelectedUrl('')
      return
    }

    let isCancelled = false
    let objectUrl = ''

    const loadRecord = async () => {
      const record = await getVideoLibraryRecord(selectedId)
      if (isCancelled) return

      const hydratedRecord = record ? await hydrateRecordMetadata(record) : null
      if (isCancelled) return

      if (record && hydratedRecord?.metadata && !record.metadata) {
        void refreshItems()
      }

      setSelectedRecord(hydratedRecord)
      if (!hydratedRecord) {
        setSelectedUrl('')
        return
      }

      objectUrl = URL.createObjectURL(hydratedRecord.blob)
      setSelectedUrl(objectUrl)
    }

    void loadRecord()

    return () => {
      isCancelled = true
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [selectedId])

  const updateOverlaySize = () => {
    if (!videoRef.current) return
    setOverlayWidth(videoRef.current.offsetWidth)
    setOverlayHeight(videoRef.current.offsetHeight)
  }

  useEffect(() => {
    updateOverlaySize()
    window.addEventListener('resize', updateOverlaySize)

    const onFullscreen = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current)
      updateOverlaySize()
    }

    document.addEventListener('fullscreenchange', onFullscreen)

    return () => {
      window.removeEventListener('resize', updateOverlaySize)
      document.removeEventListener('fullscreenchange', onFullscreen)
    }
  }, [selectedRecord])

  const shapes = useMemo(() => selectedRecord?.metadata?.shapes ?? [], [selectedRecord])
  const playbackEdits = useMemo<PlaybackEditSegment[]>(() => {
    if (!selectedRecord?.metadata || selectedRecord.metadata.schemaVersion !== 3) {
      return []
    }

    return [...(selectedRecord.metadata.playbackEdits ?? [])].sort((a, b) => a.startTime - b.startTime)
  }, [selectedRecord])
  const analysisSegments = useMemo<AnalysisSegment[]>(() => {
    if (!selectedRecord?.metadata || selectedRecord.metadata.schemaVersion !== 3) {
      return []
    }

    return [...selectedRecord.metadata.analysisSegments].sort((a, b) => a.startTime - b.startTime)
  }, [selectedRecord])

  const playbackActiveSegment = useMemo(() => {
    if (analysisSegments.length === 0) {
      return null
    }

    const matchingSegments = analysisSegments
      .filter((segment) => currentTime >= segment.startTime && currentTime < segment.endTime)
      .sort((a, b) => a.startTime - b.startTime || a.endTime - b.endTime)

    return matchingSegments.length > 0 ? matchingSegments[matchingSegments.length - 1] : null
  }, [analysisSegments, currentTime])

  useEffect(() => {
    if (analysisSegments.length === 0) {
      setSelectedSegmentId(null)
      return
    }

    if (!selectedSegmentId || !analysisSegments.some((segment) => segment.id === selectedSegmentId)) {
      setSelectedSegmentId(analysisSegments[0].id)
    }
  }, [analysisSegments, selectedSegmentId])

  const selectedSegment = useMemo(
    () => analysisSegments.find((segment) => segment.id === selectedSegmentId) ?? null,
    [analysisSegments, selectedSegmentId]
  )

  const displayedSegment = followPlayback ? playbackActiveSegment : selectedSegment
  const videoOverlaySegment = playbackActiveSegment

  const feedback = useMemo(() => selectedRecord?.metadata?.feedback ?? [], [selectedRecord])
  const nextSteps = useMemo(() => selectedRecord?.metadata?.nextSteps ?? [], [selectedRecord])
  const isSegmentBasedFeedback = analysisSegments.length > 0
  const activeFeedbackItems = useMemo(
    () => (displayedSegment ? [...displayedSegment.feedback.checklist, ...displayedSegment.feedback.notes] : []),
    [displayedSegment]
  )
  const overlayFeedbackItems = useMemo(
    () => (videoOverlaySegment ? [...videoOverlaySegment.feedback.checklist, ...videoOverlaySegment.feedback.notes] : []),
    [videoOverlaySegment]
  )
  const overlayNextStepItems = videoOverlaySegment?.feedback.nextSteps ?? []
  const shouldShowVideoFeedbackOverlay =
    isVideoFeedbackOverlayEnabled &&
    Boolean(videoOverlaySegment) &&
    (overlayFeedbackItems.length > 0 || overlayNextStepItems.length > 0)

  const dashboardStats = useMemo(
    () => computeDashboardStats(items, dashboardRange),
    [items, dashboardRange]
  )

  const groupedItems = useMemo(() => groupItemsBySkill(items), [items])
  const typeOrder = getSportOrder(locale)

  const handlePlay = () => {
    if (!videoRef.current) return
    void videoRef.current.play().catch(() => setIsPlaying(false))
  }

  const handlePause = () => {
    if (!videoRef.current) return
    videoRef.current.pause()
  }

  const handleSeek = (time: number) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = time
    setCurrentTime(time)
  }

  const handleSpeedChange = (speed: number) => {
    if (!videoRef.current) return
    setBasePlaybackRate(speed)

    const currentVideoTime = videoRef.current.currentTime
    const activeSpeedSegment = playbackEdits.find(
      (segment) =>
        segment.action === 'speed' &&
        segment.speedFactor &&
        currentVideoTime >= segment.startTime &&
        currentVideoTime <= segment.endTime
    )

    videoRef.current.playbackRate = activeSpeedSegment?.speedFactor ?? speed
  }

  useEffect(() => {
    if (!videoRef.current) {
      return
    }

    const removeSegment = playbackEdits.find(
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

    const activeSpeedSegment = playbackEdits.find(
      (segment) =>
        segment.action === 'speed' &&
        segment.speedFactor &&
        currentTime >= segment.startTime &&
        currentTime <= segment.endTime
    )

    videoRef.current.playbackRate = activeSpeedSegment?.speedFactor ?? basePlaybackRate
  }, [currentTime, playbackEdits, basePlaybackRate])

  const handleSeekToSegment = (segment: AnalysisSegment) => {
    setSelectedSegmentId(segment.id)
    handleSeek(segment.startTime)
  }

  const formatTime = (timeInSeconds: number): string => {
    const safeTime = Math.max(0, timeInSeconds)
    const minutes = Math.floor(safeTime / 60)
    const seconds = Math.floor(safeTime % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleToggleFullscreen = async () => {
    if (!containerRef.current) return

    try {
      if (document.fullscreenElement === containerRef.current) {
        await document.exitFullscreen()
      } else {
        await containerRef.current.requestFullscreen()
      }
    } catch {
      // Ignore fullscreen failures on unsupported devices.
    }
  }

  const handleOpenInAnalyze = () => {
    if (!selectedRecord || !selectedUrl) return

    navigate('/analyze', {
      state: {
        videoFile: selectedRecord.blob,
        videoUrl: selectedUrl,
        videoName: selectedRecord.name,
        embeddedMetadata: selectedRecord.metadata,
        libraryId: selectedRecord.id,
      },
    })
  }

  const handleDelete = async (id: string) => {
    await deleteVideoLibraryRecord(id)
    if (selectedId === id) {
      setSelectedId(null)
      setSelectedRecord(null)
      setSelectedUrl('')
    }
    await refreshItems()
  }

  const handleViewChange = (nextView: 'videos' | 'insights') => {
    const nextParams = new URLSearchParams(searchParams)
    if (nextView === 'videos') {
      nextParams.delete('view')
    } else {
      nextParams.set('view', nextView)
    }
    setSearchParams(nextParams, { replace: true })
  }

  return (
    <div className="history">
      <AppNav />
      <header className="page-header">
        <h1><Trans k="history.title" /></h1>
        <p>{t('history.subtitle')}</p>
        <div className="history-view-toggle" role="tablist" aria-label={t('history.viewLabel')}>
          <button
            type="button"
            role="tab"
            aria-selected={historyView === 'videos'}
            className={historyView === 'videos' ? 'active' : ''}
            onClick={() => handleViewChange('videos')}
          >
            {t('history.viewVideos')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={historyView === 'insights'}
            className={historyView === 'insights' ? 'active' : ''}
            onClick={() => handleViewChange('insights')}
          >
            {t('history.viewInsights')}
          </button>
        </div>
      </header>

      {historyView === 'insights' ? (
        <>
          <HistoryDashboard
            range={dashboardRange}
            onRangeChange={setDashboardRange}
            stats={dashboardStats}
            formatDate={(timestamp) => formatDate(timestamp, locale)}
          />
          <p className="history-mode-hint">
            {t('history.insightHint')}
          </p>
        </>
      ) : (
        <>
          <hr style={{ margin: '24px 0' }} />

          <div className="history-content-layout">
            <HistorySkillGroups
              isLoading={isLoading}
              groupedItems={groupedItems}
              typeOrder={typeOrder}
              selectedId={selectedId}
              onOpenItem={setSelectedId}
              onDelete={(id) => void handleDelete(id)}
              formatDate={(timestamp) => formatDate(timestamp, locale)}
              formatBytes={formatBytes}
            />

            <section className="history-main-panel">
              {!selectedRecord || !selectedUrl ? (
                <p>{t('history.selectVideo')}</p>
              ) : (
                <>
                  <h2 style={{ marginTop: 0 }}>{selectedRecord.name}</h2>

                  <div ref={containerRef} className={`video-stage ${isFullscreen ? 'is-fullscreen' : ''}`}>
                    <video
                      ref={videoRef}
                      src={selectedUrl}
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                      onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                      onLoadedMetadata={(event) => {
                        const nextDuration = event.currentTarget.duration
                        if (Number.isFinite(nextDuration) && nextDuration > 0) {
                          setDuration(nextDuration)
                        }
                        updateOverlaySize()
                      }}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={() => setIsPlaying(false)}
                    />

                    {overlayWidth > 0 && overlayHeight > 0 && shapes.length > 0 && (
                      <ShapeOverlay
                        width={overlayWidth}
                        height={overlayHeight}
                        currentTime={currentTime}
                        shapes={shapes}
                      />
                    )}

                    <VideoFeedbackOverlay
                      visible={shouldShowVideoFeedbackOverlay}
                      startTimeLabel={videoOverlaySegment ? formatTime(videoOverlaySegment.startTime) : undefined}
                      nextStepsTitle={t('history.nextSteps')}
                      feedbackItems={overlayFeedbackItems}
                      nextStepItems={overlayNextStepItems}
                      emptyLabel={t('history.feedbackEmpty')}
                    />

                    <div className="video-controls-overlay">
                      <Controls
                        isPlaying={isPlaying}
                        playbackRate={basePlaybackRate}
                        currentTime={currentTime}
                        duration={duration}
                        onPlay={handlePlay}
                        onPause={handlePause}
                        onSpeedChange={handleSpeedChange}
                        onSeek={handleSeek}
                        videoLoaded={true}
                        onToggleDrawing={undefined}
                        showDrawingCanvas={false}
                        onToggleFullscreen={handleToggleFullscreen}
                        isFullscreen={isFullscreen}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button type="button" className="history-action-btn history-action-btn--edit" onClick={handleOpenInAnalyze}>
                      {t('history.openAnalyze')}
                    </button>
                  </div>

                  {analysisSegments.length > 0 && (
                    <div className="history-segment-selector">
                      <h3>{t('analyze.segmentSelector.title')}</h3>
                      <div className="analyze-segment-selector__controls">
                        <button
                          type="button"
                          className={`analyze-segment-selector__btn analyze-segment-selector__btn--follow ${followPlayback ? 'active' : ''}`.trim()}
                          aria-pressed={followPlayback}
                          onClick={() => setFollowPlayback((previous) => !previous)}
                        >
                          {t('analyze.segmentSelector.followPlayback')}
                        </button>
                        <button
                          type="button"
                          className={`analyze-segment-selector__btn ${isVideoFeedbackOverlayEnabled ? 'active' : ''}`.trim()}
                          aria-pressed={isVideoFeedbackOverlayEnabled}
                          onClick={() => setIsVideoFeedbackOverlayEnabled((previous) => !previous)}
                        >
                          {t('analyze.segmentSelector.inVideoFeedback')}
                        </button>
                      </div>
                      <div className="analyze-segment-selector__chips">
                        {analysisSegments.map((segment) => {
                          const isSelected = segment.id === selectedSegmentId
                          const isActive = followPlayback && playbackActiveSegment?.id === segment.id

                          return (
                            <button
                              key={segment.id}
                              type="button"
                              className={`analyze-segment-selector__chip ${isSelected ? 'selected' : ''} ${isActive ? 'active' : ''}`.trim()}
                              onClick={() => handleSeekToSegment(segment)}
                            >
                              {t('analyze.segmentSelector.item', {
                                index: segment.attemptIndex,
                                start: formatTime(segment.startTime),
                                end: formatTime(segment.endTime),
                              })}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: '18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <h3>{t('history.feedback')}</h3>
                      {(isSegmentBasedFeedback ? activeFeedbackItems : feedback).length === 0 ? (
                        <p>{t('history.feedbackEmpty')}</p>
                      ) : (
                        <ul>
                          {(isSegmentBasedFeedback ? activeFeedbackItems : feedback).map((item, index) => (
                            <li key={`${item}-${index}`}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <h3>{t('history.nextSteps')}</h3>
                      {(isSegmentBasedFeedback ? (displayedSegment?.feedback.nextSteps ?? []) : nextSteps).length === 0 ? (
                        <p>{t('history.nextStepsEmpty')}</p>
                      ) : (
                        <ul>
                          {(isSegmentBasedFeedback ? (displayedSegment?.feedback.nextSteps ?? []) : nextSteps).map((item, index) => (
                            <li key={`${item}-${index}`}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}

export default History
