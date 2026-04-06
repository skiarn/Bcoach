import { useState, useRef, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import VideoPlayer from '../components/VideoPlayer.tsx'
import DrawingCanvas from '../components/DrawingCanvas.tsx'
import ShapeOverlay from '../components/ShapeOverlay.tsx'
import Controls from '../components/Controls.tsx'
import AppNav from '../components/AppNav.tsx'
import EditTimeline from '../components/EditTimeline.tsx'
import DrawStepPanel from '../components/analyzeSteps/DrawStepPanel.tsx'
import FeedbackStepPanel from '../components/analyzeSteps/FeedbackStepPanel.tsx'
import NextStepsStepPanel from '../components/analyzeSteps/NextStepsStepPanel.tsx'
import SaveStepPanel from '../components/analyzeSteps/SaveStepPanel.tsx'
import { findSkill, findSkillById, getSkills, Skill } from '../utils/skills.ts'
import { getVideoDisplayName } from '../utils/helpers.ts'
import { EmbeddedAnalysisMetadata, Shape } from '../types/analysis.ts'
import { appendMetadataToVideo, buildAnalyzedVideoFileName } from '../utils/videoMetadata.ts'
import { addExportedVideoBlob, getVideoLibraryRecord, upsertVideoRecord } from '../services/videoLibrary.ts'
import { DEFAULT_SPORT_ID, getSportLabel } from '../utils/sports.ts'
import { useI18n } from '../i18n/I18nProvider.tsx'
import { useVideoSegments } from '../hooks/useVideoSegments.ts'
import { applyVideoEdits } from '../utils/videoEditExport.ts'
import { ANALYZE_STEP_ORDER, AnalyzeStep, getAnalyzeStepTitleKey } from './analyze/steps.ts'

interface VideoAnalysis {
  id: string
  videoUrl: string
  videoName: string
  shapes: Shape[]
  feedback: string[]
  nextSteps: string[]
  timestamp: number
  sportId?: string
  skillId?: string
  skillName?: string
  skillType?: string
}

interface AnalyzeProps {
  videoUrl?: string
  videoFile?: File | Blob
  libraryId?: string
  embeddedMetadata?: EmbeddedAnalysisMetadata
  onBack: () => void
  onNavigateHome?: () => void
}

type Tool = "line" | "circle" | "none";

function Analyze({
  videoUrl: propVideoUrl,
  videoFile: propVideoFile,
  libraryId: propLibraryId,
  embeddedMetadata: propEmbeddedMetadata,
  onBack,
  onNavigateHome,
}: AnalyzeProps): JSX.Element {
  const { t, locale } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const stateSkill: Skill | undefined = location.state?.skill
  const existingAnalysis = location.state?.analysis as VideoAnalysis | undefined
  const routeEmbeddedMetadata = location.state?.embeddedMetadata as EmbeddedAnalysisMetadata | undefined
  const routeLibraryId = location.state?.libraryId as string | undefined
  const libraryId = propLibraryId ?? routeLibraryId
  const embeddedMetadata = propEmbeddedMetadata ?? routeEmbeddedMetadata
  const metadataSkill = useMemo(
    () => findSkillById(embeddedMetadata?.skillId, locale) ?? findSkill(embeddedMetadata?.skillName, embeddedMetadata?.sportId ?? embeddedMetadata?.skillType, locale),
    [embeddedMetadata?.skillId, embeddedMetadata?.skillName, embeddedMetadata?.sportId, embeddedMetadata?.skillType, locale]
  )
  const existingAnalysisSkill = useMemo(
    () => findSkillById(existingAnalysis?.skillId, locale) ?? findSkill(existingAnalysis?.skillName, existingAnalysis?.sportId ?? existingAnalysis?.skillType, locale),
    [existingAnalysis?.skillId, existingAnalysis?.skillName, existingAnalysis?.sportId, existingAnalysis?.skillType, locale]
  )
  const derivedSkill = stateSkill ?? metadataSkill ?? existingAnalysisSkill
  const videoUrl = propVideoUrl || location.state?.videoUrl
  const videoFile = propVideoFile || location.state?.videoFile

  // Keep a mutable working blob so edits can be applied before overlays/feedback/export.
  const [workingVideoBlob, setWorkingVideoBlob] = useState<Blob | null>(
    videoFile instanceof Blob ? videoFile : null
  )
  const [stableVideoUrl, setStableVideoUrl] = useState<string>('')
  const [isApplyingEdits, setIsApplyingEdits] = useState(false)
  const [editProgress, setEditProgress] = useState(0)
  const [editError, setEditError] = useState<string | null>(null)
  const { segments, addSegment, updateSegment, removeSegment, clearSegments } = useVideoSegments()

  useEffect(() => {
    if (videoFile instanceof Blob) {
      setWorkingVideoBlob(videoFile)
    }
  }, [videoFile])

  useEffect(() => {
    if (workingVideoBlob) {
      const blobUrl = URL.createObjectURL(workingVideoBlob)
      setStableVideoUrl(blobUrl)
      return () => {
        URL.revokeObjectURL(blobUrl)
      }
    }

    if (videoUrl) {
      setStableVideoUrl(videoUrl)
    }
  }, [workingVideoBlob, videoUrl])

  const effectiveVideoUrl = stableVideoUrl || videoUrl

  if (!effectiveVideoUrl) {
    return (
      <div className="analyze">
        <AppNav />
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={onBack}>← {t('common.back')}</button>
          <h1>{t('analyze.titleNoVideo')}</h1>
          <div></div>
        </header>
        <p>{t('analyze.noVideo')}</p>
      </div>
    )
  }
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [videoDisplayWidth, setVideoDisplayWidth] = useState(0)
  const [videoDisplayHeight, setVideoDisplayHeight] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [showDrawingCanvas, setShowDrawingCanvas] = useState(false)
  const [tool, setTool] = useState<Tool>("line");
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null)
  const [customFeedback, setCustomFeedback] = useState<string[]>([])
  const [customNextSteps, setCustomNextSteps] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState<AnalyzeStep>('draw')
  const [isSaved, setIsSaved] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [selectedSkillType, setSelectedSkillType] = useState<string>(derivedSkill?.sportId ?? DEFAULT_SPORT_ID)
  const [selectedSkillName, setSelectedSkillName] = useState<string>(derivedSkill?.name ?? '')

  const rawVideoName = videoFile instanceof File
    ? videoFile.name
    : (location.state?.videoName || existingAnalysis?.videoName)

  useEffect(() => {
    if (!derivedSkill) {
      return
    }

    setSelectedSkillType(derivedSkill.sportId)
    setSelectedSkillName(derivedSkill.name)
  }, [derivedSkill?.name, derivedSkill?.sportId])

  const availableSkills = useMemo(
    () => getSkills(locale).filter((entry) => entry.sportId === selectedSkillType),
    [selectedSkillType, locale]
  )

  const skill = useMemo(
    () => availableSkills.find((entry) => entry.name === selectedSkillName),
    [availableSkills, selectedSkillName]
  )

  const sportLabel = useMemo(
    () => (skill?.sportId ? getSportLabel(skill.sportId, locale) : undefined),
    [skill?.sportId, locale]
  )

  const videoName = useMemo(
    () => getVideoDisplayName(rawVideoName, {
      timestamp: existingAnalysis?.timestamp,
      sportLabel,
      skillName: skill?.name,
      locale,
    }),
    [rawVideoName, existingAnalysis?.timestamp, sportLabel, skill?.name, locale]
  )

  useEffect(() => {
    if (!existingAnalysis) return

    console.log('[Analyze] Loading from existingAnalysis:', existingAnalysis)
    setShapes(existingAnalysis.shapes ?? [])
    setCustomFeedback(existingAnalysis.feedback ?? [])
    setCustomNextSteps(existingAnalysis.nextSteps ?? [])
  }, [existingAnalysis])

  useEffect(() => {
    if (existingAnalysis || !embeddedMetadata) return

    console.log('[Analyze] Loading from embeddedMetadata:', embeddedMetadata)
    setShapes(embeddedMetadata.shapes ?? [])
    setCustomFeedback(embeddedMetadata.feedback ?? [])
    setCustomNextSteps(embeddedMetadata.nextSteps ?? [])
  }, [embeddedMetadata, existingAnalysis])

  // Debug: Log when embeddedMetadata changes
  useEffect(() => {
    if (embeddedMetadata) {
      console.log('[Analyze] embeddedMetadata available:', {
        shapes: embeddedMetadata.shapes?.length ?? 0,
        feedback: embeddedMetadata.feedback?.length ?? 0,
        nextSteps: embeddedMetadata.nextSteps?.length ?? 0,
      })
    }
  }, [embeddedMetadata])

  const getSafeDuration = (): number => {
    if (!videoRef.current) return 0

    const nativeDuration = videoRef.current.duration
    if (Number.isFinite(nativeDuration) && nativeDuration > 0) {
      return nativeDuration
    }

    const seekable = videoRef.current.seekable
    if (seekable.length > 0) {
      const seekableEnd = seekable.end(seekable.length - 1)
      if (Number.isFinite(seekableEnd) && seekableEnd > 0) {
        return seekableEnd
      }
    }

    return 0
  }

  // Video event handlers
  const handlePlay = () => {
    if (videoRef.current) {
      void videoRef.current.play().catch(() => {
        setIsPlaying(false)
      })
    }
  }

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
      setPlaybackRate(speed)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const nextTime = videoRef.current.currentTime
      setCurrentTime(nextTime)

      const safeDuration = getSafeDuration()
      if (safeDuration > 0 && duration <= 0) {
        setDuration(safeDuration)
      }

      if (nextTime > duration) {
        setDuration(nextTime)
      }
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(getSafeDuration())
      setVideoDisplayWidth(videoRef.current.offsetWidth)
      setVideoDisplayHeight(videoRef.current.offsetHeight)
      setVideoLoaded(true)
    }
  }

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (videoContainerRef.current) {
          await videoContainerRef.current.requestFullscreen()
        }
      } else {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error)
    }
  }

  const formatTime = (timeInSeconds: number): string => {
    const safeTime = Math.max(0, timeInSeconds)
    const minutes = Math.floor(safeTime / 60)
    const seconds = Math.floor(safeTime % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const selectedShape = shapes.find((shape) => shape.id === selectedShapeId) ?? null

  useEffect(() => {
    const updateVideoDisplaySize = () => {
      if (!videoRef.current) return

      setVideoDisplayWidth(videoRef.current.offsetWidth)
      setVideoDisplayHeight(videoRef.current.offsetHeight)
    }

    updateVideoDisplaySize()

    const video = videoRef.current
    let resizeObserver: ResizeObserver | null = null

    if (video && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateVideoDisplaySize()
      })

      resizeObserver.observe(video)
    }

    window.addEventListener('resize', updateVideoDisplaySize)
    const handleFullscreenChange = () => {
      const activeElement = document.fullscreenElement
      setIsFullscreen(activeElement === videoContainerRef.current)
      updateVideoDisplaySize()
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updateVideoDisplaySize)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [videoLoaded])

  useEffect(() => {
    if (!videoRef.current) return

    const video = videoRef.current

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => {
      setIsPlaying(false)
      const actualEndTime = video.currentTime
      setCurrentTime(actualEndTime)

      // Some recordings report a longer metadata duration than what actually plays.
      // When ended fires, trust the real end time so the progress reaches 100%.
      setDuration((previousDuration) => {
        if (previousDuration <= 0) return actualEndTime
        if (previousDuration - actualEndTime > 0.25) return actualEndTime
        return Math.max(previousDuration, actualEndTime)
      })
    }

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('ended', onEnded)

    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('ended', onEnded)
    }
  }, [videoLoaded])

  useEffect(() => {
    if (shapes.length === 0) {
      setSelectedShapeId(null)
      return
    }

    if (!selectedShapeId || !shapes.some((shape) => shape.id === selectedShapeId)) {
      setSelectedShapeId(shapes[shapes.length - 1].id)
    }
  }, [shapes, selectedShapeId])

  useEffect(() => {
    if (currentStep !== 'draw' && showDrawingCanvas) {
      setShowDrawingCanvas(false)
    }

    if (currentStep === 'draw' && !showDrawingCanvas) {
      setShowDrawingCanvas(true)
    }

    if (currentStep !== 'draw' && document.fullscreenElement === videoContainerRef.current) {
      void document.exitFullscreen().catch(() => {
        // Ignore exit fullscreen failure when leaving draw step.
      })
    }
  }, [currentStep, showDrawingCanvas])

  const updateSelectedShapeRange = (field: 'visibleFrom' | 'visibleTo', value: number) => {
    if (!selectedShapeId) return

    setShapes((prevShapes) =>
      prevShapes.map((shape) => {
        if (shape.id !== selectedShapeId) {
          return shape
        }

        const safeDuration = duration > 0 ? duration : value
        const nextValue = Math.max(0, Math.min(value, safeDuration))
        const currentFrom = shape.visibleFrom ?? 0
        const currentTo = shape.visibleTo ?? safeDuration

        if (field === 'visibleFrom') {
          return {
            ...shape,
            visibleFrom: Math.min(nextValue, currentTo),
            visibleTo: currentTo,
          }
        }

        return {
          ...shape,
          visibleFrom: currentFrom,
          visibleTo: Math.max(nextValue, currentFrom),
        }
      })
    )
  }

  const getSourceVideoBlob = async (): Promise<Blob> => {
    if (workingVideoBlob instanceof Blob) {
      return workingVideoBlob
    }

    if (videoFile instanceof Blob) {
      return videoFile
    }

    const response = await fetch(effectiveVideoUrl)
    if (!response.ok) {
      throw new Error(t('analyze.error.readVideo'))
    }

    return response.blob()
  }

  const triggerDownload = (blob: Blob, fileName: string) => {
    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = fileName
    link.click()
    URL.revokeObjectURL(downloadUrl)
  }

  const handleSaveAnalysis = async (nextShapes: Shape[]) => {
    setSaveError(null)

    const feedback = customFeedback.length > 0
      ? customFeedback
      : (embeddedMetadata?.feedback ?? existingAnalysis?.feedback ?? [])

    const nextSteps = customNextSteps.length > 0
      ? customNextSteps
      : (embeddedMetadata?.nextSteps ?? existingAnalysis?.nextSteps ?? [])

    const metadata: EmbeddedAnalysisMetadata = {
      schemaVersion: 2,
      savedAt: Date.now(),
      sourceVideoName: videoName,
      sportId: skill?.sportId,
      skillId: skill?.id,
      skillName: skill?.name,
      skillType: skill?.sportId,
      shapes: nextShapes,
      feedback,
      nextSteps,
    }

    setIsExporting(true)

    try {
      console.log('[Export] Starting export process...')
      const sourceBlob = await getSourceVideoBlob()
      console.log('[Export] Source blob loaded:', sourceBlob.size, 'bytes')

      const fileName = buildAnalyzedVideoFileName(rawVideoName || videoName, {
        timestamp: existingAnalysis?.timestamp,
        sportLabel,
        skillName: skill?.name,
      })
      console.log('[Export] Attaching metadata with ffmpeg...')

      const packagedBlob = await appendMetadataToVideo(sourceBlob, metadata, fileName)
      console.log('[Export] Metadata attached:', packagedBlob.size, 'bytes')

      console.log('[Export] Saving to IndexedDB...')
      await addExportedVideoBlob(packagedBlob, fileName, metadata)
      console.log('[Export] Saved to IndexedDB')

      console.log('[Export] Triggering download...')
      triggerDownload(packagedBlob, fileName)
      console.log('[Export] Download triggered, export complete!')
      setIsSaved(true)
    } catch (error) {
      const message = error instanceof Error && error.message === t('analyze.error.readVideo')
        ? error.message
        : t('analyze.error.saveVideo')
      console.error('[Export] Error:', message, error)
      setSaveError(message)
    } finally {
      setIsExporting(false)
    }
  }

  const clearCanvas = () => {
    setShapes([]);
    setSelectedShapeId(null)
  };

  const undoLastShape = () => {
    setShapes((prev) => prev.slice(0, -1));
  };

  const saveAnalysisToLibrary = async (nextShapes: Shape[]) => {
    if (!libraryId) {
      setSaveError(t('analyze.error.missingVideoId'))
      return
    }

    setSaveError(null)

    try {
      const record = await getVideoLibraryRecord(libraryId)
      if (!record) {
        setSaveError(t('analyze.error.videoMissing'))
        return
      }

      const feedback = customFeedback.length > 0
        ? customFeedback
        : (embeddedMetadata?.feedback ?? existingAnalysis?.feedback ?? [])

      const nextSteps = customNextSteps.length > 0
        ? customNextSteps
        : (embeddedMetadata?.nextSteps ?? existingAnalysis?.nextSteps ?? [])

      const metadata: EmbeddedAnalysisMetadata = {
        schemaVersion: 2,
        savedAt: Date.now(),
        sourceVideoName: videoName,
        sportId: skill?.sportId,
        skillId: skill?.id,
        skillName: skill?.name,
        skillType: skill?.sportId,
        shapes: nextShapes,
        feedback,
        nextSteps,
      }

      console.log('[LibrarySave] Updating library record with metadata...')
      const updatedBlob = workingVideoBlob ?? record.blob
      const updatedRecord = {
        ...record,
        metadata,
        blob: updatedBlob,
        size: updatedBlob.size,
        mimeType: updatedBlob.type || record.mimeType,
        lastModified: Date.now(),
      }
      await upsertVideoRecord(updatedRecord)
      console.log('[LibrarySave] Library record updated successfully')

      setIsSaved(true)
    } catch (error) {
      const message = t('analyze.error.saveAnalysis')
      console.error('[LibrarySave] Error:', message, error)
      setSaveError(message)
    }
  }

  const saveAnalysis = () => {
    void handleSaveAnalysis(shapes)
  };

  const applySegmentEdits = async () => {
    if (segments.length === 0) {
      setEditError(t('editor.error.noSegments'))
      return
    }

    setEditError(null)
    setIsApplyingEdits(true)
    setEditProgress(0)

    try {
      const sourceBlob = await getSourceVideoBlob()
      const editedBlob = await applyVideoEdits(
        sourceBlob,
        videoName || 'video.mp4',
        segments,
        duration,
        setEditProgress
      )

      if (videoRef.current) {
        videoRef.current.pause()
      }

      setWorkingVideoBlob(editedBlob)
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
      setVideoLoaded(false)
      clearSegments()
    } catch {
      setEditError(t('editor.error.exportFailed'))
    } finally {
      setIsApplyingEdits(false)
      setEditProgress(0)
    }
  }

  const quickSaveAnalysis = () => {
    void saveAnalysisToLibrary(shapes)
  };

  const stepOrder = ANALYZE_STEP_ORDER
  const stepIndex = stepOrder.indexOf(currentStep)
  const showVideoWorkspace = currentStep === 'draw'

  const goToPreviousStep = () => {
    if (stepIndex <= 0) return
    setCurrentStep(stepOrder[stepIndex - 1])
  }

  const goToNextStep = () => {
    if (stepIndex >= stepOrder.length - 1) return
    setCurrentStep(stepOrder[stepIndex + 1])
  }

  const getStepTitle = () => {
    return t(getAnalyzeStepTitleKey(currentStep))
  }

  const getHomeSelectionSearch = (): string => {
    if (!skill) return ''

    const params = new URLSearchParams()
    params.set('sport', skill.sportId)
    params.set('skill', skill.name)
    params.set('skillId', skill.id)
    params.set('skillType', skill.sportId)
    return params.toString()
  }

  const handleNavigateToHome = () => {
    onNavigateHome?.()
    const search = getHomeSelectionSearch()
    navigate({
      pathname: '/',
      search: search ? `?${search}` : '',
    })
  }

  const initialFeedbackValues = customFeedback.length > 0 ? customFeedback : (existingAnalysis?.feedback ?? embeddedMetadata?.feedback ?? [])
  const initialNextStepValues = customNextSteps.length > 0 ? customNextSteps : (existingAnalysis?.nextSteps ?? embeddedMetadata?.nextSteps ?? [])

  return (
    <div className="analyze">
      <AppNav />
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={onBack}>← {t('common.back')}</button>
        <h1>{t('analyze.title', { videoName })}</h1>
        <div></div>
      </header>

      <div className="analyze-stepper" style={{ marginBottom: '16px' }}>
        <div className={`analyze-step ${currentStep === 'draw' ? 'active' : ''}`}>1. {t('analyze.step1')}</div>
        <div className={`analyze-step ${currentStep === 'feedback' ? 'active' : ''}`}>2. {t('analyze.step2')}</div>
        <div className={`analyze-step ${currentStep === 'nextSteps' ? 'active' : ''}`}>3. {t('analyze.step3')}</div>
        <div className={`analyze-step ${currentStep === 'save' ? 'active' : ''}`}>4. {t('analyze.step4')}</div>
      </div>

      <div style={{ position: 'relative', display: 'block' }}>
        {/* Video Section */}
        {showVideoWorkspace && (
          <div style={{ flex: 1 }}>
          <div
            ref={videoContainerRef}
            className={`video-stage ${isFullscreen ? 'is-fullscreen' : ''}`}
          >
            <VideoPlayer
              ref={videoRef}
              src={effectiveVideoUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              isFullscreen={isFullscreen}
            />

            {showDrawingCanvas && videoLoaded && videoDisplayWidth > 0 && videoDisplayHeight > 0 && (
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                zIndex: 10
              }}>
                <DrawingCanvas
                  width={videoDisplayWidth}
                  height={videoDisplayHeight}
                  tool={tool}
                  shapes={shapes}
                  onShapesChange={setShapes}
                  currentTime={currentTime}
                  duration={duration}
                />
              </div>
            )}

            {!showDrawingCanvas && videoLoaded && videoDisplayWidth > 0 && videoDisplayHeight > 0 && shapes.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                zIndex: 10
              }}>
                <ShapeOverlay
                  width={videoDisplayWidth}
                  height={videoDisplayHeight}
                  shapes={shapes}
                  currentTime={currentTime}
                />
              </div>
            )}

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
                videoLoaded={videoLoaded}
                onToggleDrawing={() => setShowDrawingCanvas(!showDrawingCanvas)}
                showDrawingCanvas={showDrawingCanvas}
                onToggleFullscreen={handleToggleFullscreen}
                isFullscreen={isFullscreen}
              />
            </div>
          </div>

          {showDrawingCanvas && (
            <div className="drawing-tools">
              <button onClick={() => setTool("line")}>{t('analyze.tool.line')}</button>
              <button onClick={() => setTool("circle")}>{t('analyze.tool.circle')}</button>
              <button onClick={() => setTool("none")}>{t('analyze.tool.none')}</button>
              <button onClick={undoLastShape}>{t('analyze.tool.undo')}</button>
              <button onClick={clearCanvas}>{t('analyze.tool.clear')}</button>
            </div>
          )}
                    {showDrawingCanvas && shapes.length > 0 && (
            <div className="shape-timeline-editor">
              <h3>{t('analyze.timeline.title')}</h3>

              <div className="shape-selector-list">
                {shapes.map((shape, index) => (
                  <button
                    key={shape.id}
                    type="button"
                    className={selectedShapeId === shape.id ? 'active' : ''}
                    onClick={() => setSelectedShapeId(shape.id)}
                  >
                    {shape.type === 'line' ? t('analyze.tool.line') : t('analyze.tool.circle')} #{index + 1}
                  </button>
                ))}
              </div>

              {selectedShape && (
                <div className="shape-range-controls">
                  <label>
                    {t('analyze.timeline.start', { time: formatTime(selectedShape.visibleFrom ?? 0) })}
                    <input
                      type="range"
                      min={0}
                      max={duration || 0}
                      step={0.1}
                      value={selectedShape.visibleFrom ?? 0}
                      onChange={(e) => updateSelectedShapeRange('visibleFrom', Number(e.target.value))}
                      disabled={duration <= 0}
                    />
                  </label>

                  <label>
                    {t('analyze.timeline.end', { time: formatTime(selectedShape.visibleTo ?? duration) })}
                    <input
                      type="range"
                      min={0}
                      max={duration || 0}
                      step={0.1}
                      value={selectedShape.visibleTo ?? duration}
                      onChange={(e) => updateSelectedShapeRange('visibleTo', Number(e.target.value))}
                      disabled={duration <= 0}
                    />
                  </label>
                </div>
              )}
            </div>
          )}

          {videoLoaded && duration > 0 && (
            <div className="shape-timeline-editor" style={{ marginTop: '14px' }}>
              <h3>{t('analyze.edit.title')}</h3>
              <p style={{ marginTop: '6px', color: '#555' }}>{t('analyze.edit.help')}</p>

              <EditTimeline
                duration={duration}
                currentTime={currentTime}
                segments={segments}
                onAddSegment={addSegment}
                onUpdateSegment={updateSegment}
                onRemoveSegment={removeSegment}
                onSeek={handleSeek}
              />

              <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="analyze-inline-btn analyze-inline-btn--apply"
                  onClick={() => void applySegmentEdits()}
                  disabled={segments.length === 0 || isApplyingEdits}
                >
                  {isApplyingEdits
                    ? t('analyze.edit.applying', { progress: Math.round(editProgress * 100) })
                    : t('analyze.edit.apply')}
                </button>

                <button
                  type="button"
                  className="analyze-inline-btn"
                  onClick={clearSegments}
                  disabled={segments.length === 0 || isApplyingEdits}
                >
                  {t('editor.clearSegments')}
                </button>
              </div>

              {editError && (
                <p style={{ marginTop: '8px', color: '#c62828' }}>{editError}</p>
              )}
            </div>
          )}
          </div>
        )}

        {/* Focused Step Section */}
        <div style={{ width: '100%', marginTop: showVideoWorkspace ? '16px' : '0' }}>
          <div className="analyze-step-panel">
            {currentStep !== 'draw' && <h3>{getStepTitle()}</h3>}

            {currentStep === 'draw' && (
              <DrawStepPanel
                title={getStepTitle()}
                help={t('analyze.draw.help')}
                tip={t('analyze.draw.tip')}
              />
            )}

            {currentStep === 'feedback' && (
              <FeedbackStepPanel
                skill={skill}
                initialFeedback={initialFeedbackValues}
                initialNextSteps={initialNextStepValues}
                onFeedbackChange={setCustomFeedback}
                onNextStepsChange={setCustomNextSteps}
              />
            )}

            {currentStep === 'nextSteps' && (
              <NextStepsStepPanel
                skill={skill}
                skillLabel={t('analyze.nextSteps.skillLabel')}
                selectedSkillType={selectedSkillType}
                selectedSkillName={selectedSkillName}
                initialFeedback={initialFeedbackValues}
                initialNextSteps={initialNextStepValues}
                onSkillTypeChange={setSelectedSkillType}
                onSkillNameChange={setSelectedSkillName}
                onFeedbackChange={setCustomFeedback}
                onNextStepsChange={setCustomNextSteps}
              />
            )}

            {currentStep === 'save' && (
              <SaveStepPanel
                isSaved={isSaved}
                saveError={saveError}
                feedbackCountLabel={t('analyze.save.feedbackPoints', { count: customFeedback.length })}
                nextStepsCountLabel={t('analyze.save.nextSteps', { count: customNextSteps.length })}
                readyLabel={t('analyze.save.ready')}
                helpLabel={t('analyze.save.help')}
                savedTitleLabel={t('analyze.saved.title')}
                savedBodyLabel={t('analyze.saved.body')}
                savedCtaLabel={t('analyze.saved.cta')}
                onNavigateHome={handleNavigateToHome}
              />
            )}

            <div className="analyze-step-actions">
              <button type="button" onClick={goToPreviousStep} disabled={stepIndex === 0}>
                ← {t('analyze.prev')}
              </button>
              {currentStep === 'save' ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={quickSaveAnalysis}
                    disabled={isSaved || isExporting}
                    title={t('analyze.quickSave.title')}
                  >
                    {isExporting ? t('analyze.saving') : `💾 ${t('analyze.quickSave')}`}
                  </button>
                  <button
                    type="button"
                    onClick={saveAnalysis}
                    className="analyze-save-cta"
                    disabled={isSaved || isExporting}
                    title={t('analyze.export.title')}
                  >
                    {isSaved ? t('analyze.exported') : isExporting ? t('analyze.exporting') : `⬇️ ${t('analyze.export')}`}
                  </button>
                </div>
              ) : (
                <button type="button" onClick={goToNextStep} disabled={stepIndex === stepOrder.length - 1}>
                  {t('analyze.next')} →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analyze