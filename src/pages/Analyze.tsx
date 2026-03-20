import { useState, useRef, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import VideoPlayer from '../components/VideoPlayer.tsx'
import DrawingCanvas from '../components/DrawingCanvas.tsx'
import ShapeOverlay from '../components/ShapeOverlay.tsx'
import Controls from '../components/Controls.tsx'
import FeedbackPanel from '../components/FeedbackPanel.tsx'
import SkillPicker from '../components/SkillPicker.tsx'
import { Skill, skills } from '../utils/skills.ts'
import { getVideoDisplayName } from '../utils/helpers.ts'
import { EmbeddedAnalysisMetadata, Shape } from '../types/analysis.ts'
import { appendMetadataToVideo, buildAnalyzedVideoFileName } from '../utils/videoMetadata.ts'
import { addExportedVideoBlob, getVideoLibraryRecord, upsertVideoRecord } from '../services/videoLibrary.ts'

interface VideoAnalysis {
  id: string
  videoUrl: string
  videoName: string
  shapes: Shape[]
  feedback: string[]
  nextSteps: string[]
  timestamp: number
  skillName?: string
  skillType?: string
}

interface AnalyzeProps {
  videoUrl?: string
  videoFile?: File | Blob
  embeddedMetadata?: EmbeddedAnalysisMetadata
  onBack: () => void
}

type Tool = "line" | "circle" | "none";
type AnalyzeStep = 'draw' | 'feedback' | 'nextSteps' | 'save'

function Analyze({
  videoUrl: propVideoUrl,
  videoFile: propVideoFile,
  embeddedMetadata: propEmbeddedMetadata,
  onBack,
}: AnalyzeProps): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const stateSkill: Skill | undefined = location.state?.skill
  const existingAnalysis = location.state?.analysis as VideoAnalysis | undefined
  const routeEmbeddedMetadata = location.state?.embeddedMetadata as EmbeddedAnalysisMetadata | undefined
  const embeddedMetadata = propEmbeddedMetadata ?? routeEmbeddedMetadata
  const metadataSkill = useMemo(
    () => skills.find(
      (entry) => entry.name === embeddedMetadata?.skillName && entry.type === embeddedMetadata?.skillType
    ),
    [embeddedMetadata?.skillName, embeddedMetadata?.skillType]
  )
  const derivedSkill = stateSkill ?? metadataSkill ?? skills.find(
    (entry) => entry.name === existingAnalysis?.skillName && entry.type === existingAnalysis?.skillType
  )
  const videoUrl = propVideoUrl || location.state?.videoUrl
  const videoFile = propVideoFile || location.state?.videoFile

  // Create a stable blob URL from videoFile if videoUrl is not reliable
  const [stableVideoUrl, setStableVideoUrl] = useState<string>('')

  useEffect(() => {
    if (videoFile && videoFile instanceof Blob) {
      const blobUrl = URL.createObjectURL(videoFile)
      setStableVideoUrl(blobUrl)
      return () => {
        URL.revokeObjectURL(blobUrl)
      }
    }

    if (videoUrl) {
      setStableVideoUrl(videoUrl)
    }
  }, [videoFile, videoUrl])

  const effectiveVideoUrl = stableVideoUrl || videoUrl

  if (!effectiveVideoUrl) {
    return (
      <div className="analyze">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={onBack}>← Tillbaka</button>
          <h1>Videoanalys</h1>
          <div></div>
        </header>
        <p>Ingen video vald. Välj en video först.</p>
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
  const [selectedSkillType, setSelectedSkillType] = useState<Skill['type']>(derivedSkill?.type ?? 'beachvolley')
  const [selectedSkillName, setSelectedSkillName] = useState<string>(derivedSkill?.name ?? '')

  const rawVideoName = videoFile instanceof File
    ? videoFile.name
    : (location.state?.videoName || existingAnalysis?.videoName)

  const videoName = useMemo(
    () => getVideoDisplayName(rawVideoName, existingAnalysis?.timestamp),
    [rawVideoName, existingAnalysis?.timestamp]
  )

  useEffect(() => {
    if (!derivedSkill) {
      return
    }

    setSelectedSkillType(derivedSkill.type)
    setSelectedSkillName(derivedSkill.name)
  }, [derivedSkill?.name, derivedSkill?.type])

  const availableSkills = useMemo(
    () => skills.filter((entry) => entry.type === selectedSkillType),
    [selectedSkillType]
  )

  const skill = useMemo(
    () => availableSkills.find((entry) => entry.name === selectedSkillName),
    [availableSkills, selectedSkillName]
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
    if (videoFile instanceof Blob) {
      return videoFile
    }

    const response = await fetch(effectiveVideoUrl)
    if (!response.ok) {
      throw new Error('Kunde inte läsa videofilen för export.')
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
      schemaVersion: 1,
      savedAt: Date.now(),
      sourceVideoName: videoName,
      skillName: skill?.name,
      skillType: skill?.type,
      shapes: nextShapes,
      feedback,
      nextSteps,
    }

    setIsExporting(true)

    try {
      console.log('[Export] Starting export process...')
      const sourceBlob = await getSourceVideoBlob()
      console.log('[Export] Source blob loaded:', sourceBlob.size, 'bytes')

      const fileName = buildAnalyzedVideoFileName(videoName)
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
      const message = error instanceof Error ? error.message : 'Kunde inte spara videon just nu.'
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
    if (!location.state?.libraryId) {
      setSaveError('Kunde inte spara: Video-ID saknas')
      return
    }

    setSaveError(null)

    try {
      const libraryId = location.state.libraryId as string
      const record = await getVideoLibraryRecord(libraryId)
      if (!record) {
        setSaveError('Kunde inte hitta videon i biblioteket')
        return
      }

      const feedback = customFeedback.length > 0
        ? customFeedback
        : (embeddedMetadata?.feedback ?? existingAnalysis?.feedback ?? [])

      const nextSteps = customNextSteps.length > 0
        ? customNextSteps
        : (embeddedMetadata?.nextSteps ?? existingAnalysis?.nextSteps ?? [])

      const metadata: EmbeddedAnalysisMetadata = {
        schemaVersion: 1,
        savedAt: Date.now(),
        sourceVideoName: videoName,
        skillName: skill?.name,
        skillType: skill?.type,
        shapes: nextShapes,
        feedback,
        nextSteps,
      }

      console.log('[LibrarySave] Updating library record with metadata...')
      const updatedRecord = {...record, metadata}
      await upsertVideoRecord(updatedRecord)
      console.log('[LibrarySave] Library record updated successfully')

      setIsSaved(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kunde inte spara analysen.'
      console.error('[LibrarySave] Error:', message, error)
      setSaveError(message)
    }
  }

  const saveAnalysis = () => {
    void handleSaveAnalysis(shapes)
  };

  const quickSaveAnalysis = () => {
    void saveAnalysisToLibrary(shapes)
  };

  const stepOrder: AnalyzeStep[] = ['draw', 'feedback', 'nextSteps', 'save']
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
    if (currentStep === 'draw') return 'Steg 1: Rita och redigera video'
    if (currentStep === 'feedback') return 'Steg 2: Fyll i Feedback'
    if (currentStep === 'nextSteps') return 'Steg 3: Välj Nästa steg'
    return 'Steg 4: Spara analys'
  }

  const getHomeSelectionSearch = (): string => {
    if (!skill) return ''

    const params = new URLSearchParams()
    params.set('sport', skill.type)
    params.set('skill', skill.name)
    params.set('skillType', skill.type)
    return params.toString()
  }

  return (
    <div className="analyze">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={onBack}>← Tillbaka</button>
        <h1>Videoanalys: {videoName}</h1>
        <div></div>
      </header>

      <div className="analyze-stepper" style={{ marginBottom: '16px' }}>
        <div className={`analyze-step ${currentStep === 'draw' ? 'active' : ''}`}>1. Rita</div>
        <div className={`analyze-step ${currentStep === 'feedback' ? 'active' : ''}`}>2. Feedback</div>
        <div className={`analyze-step ${currentStep === 'nextSteps' ? 'active' : ''}`}>3. Nästa steg</div>
        <div className={`analyze-step ${currentStep === 'save' ? 'active' : ''}`}>4. Spara</div>
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
              <button onClick={() => setTool("line")}>Line</button>
              <button onClick={() => setTool("circle")}>Circle</button>
              <button onClick={() => setTool("none")}>None</button>
              <button onClick={undoLastShape}>Undo</button>
              <button onClick={clearCanvas}>Clear</button>
            </div>
          )}

          {showDrawingCanvas && shapes.length > 0 && (
            <div className="shape-timeline-editor">
              <h3>Visa ritningar under delar av videon</h3>

              <div className="shape-selector-list">
                {shapes.map((shape, index) => (
                  <button
                    key={shape.id}
                    type="button"
                    className={selectedShapeId === shape.id ? 'active' : ''}
                    onClick={() => setSelectedShapeId(shape.id)}
                  >
                    {shape.type === 'line' ? 'Linje' : 'Cirkel'} #{index + 1}
                  </button>
                ))}
              </div>

              {selectedShape && (
                <div className="shape-range-controls">
                  <label>
                    Start: {formatTime(selectedShape.visibleFrom ?? 0)}
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
                    Slut: {formatTime(selectedShape.visibleTo ?? duration)}
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
          </div>
        )}

        {/* Focused Step Section */}
        <div style={{ width: '100%', marginTop: showVideoWorkspace ? '16px' : '0' }}>
          <div className="analyze-step-panel">
            {currentStep !== 'draw' && <h3>{getStepTitle()}</h3>}

            {currentStep === 'draw' && (
              <div>
                <p>
                  Spela upp videon, rita linjer/cirklar och justera när ritningarna ska synas.
                </p>
                <p style={{ color: '#555', fontSize: '0.9rem' }}>
                  Tips: Välj en form i tidslinjen och finjustera Start/Slut under videon.
                </p>
                <h3 style={{ marginTop: '14px' }}>{getStepTitle()}</h3>
              </div>
            )}

            {currentStep === 'feedback' && (
              <FeedbackPanel
                skill={skill}
                mode="feedback"
                initialFeedback={existingAnalysis?.feedback || customFeedback}
                initialNextSteps={existingAnalysis?.nextSteps || customNextSteps}
                onFeedbackChange={setCustomFeedback}
                onNextStepsChange={setCustomNextSteps}
              />
            )}

            {currentStep === 'nextSteps' && (
              <div>
                {!skill && (
                  <SkillPicker
                    label="Välj sport och teknik för att få relevanta nästa steg"
                    selectedSkillType={selectedSkillType}
                    selectedSkillName={selectedSkillName}
                    onSkillTypeChange={setSelectedSkillType}
                    onSkillNameChange={setSelectedSkillName}
                    allowDeselect={true}
                    className="home-skill-picker"
                  />
                )}

                <FeedbackPanel
                  skill={skill}
                  mode="nextSteps"
                  initialFeedback={existingAnalysis?.feedback || customFeedback}
                  initialNextSteps={existingAnalysis?.nextSteps || customNextSteps}
                  onFeedbackChange={setCustomFeedback}
                  onNextStepsChange={setCustomNextSteps}
                />
              </div>
            )}

            {currentStep === 'save' && (
              <div>
                {!isSaved ? (
                  <>
                    <p>Redo att spara videon - välj antingen lokalt spara (i biblioteket) eller exportera (ladda ner med metadata).</p>
                    <ul style={{ margin: '10px 0 0 18px' }}>
                      <li>Feedbackpunkter: {customFeedback.length}</li>
                      <li>Nästa steg: {customNextSteps.length}</li>
                    </ul>
                    <p style={{ marginTop: '10px', color: '#555' }}>
                      Lokalt spara sparar analysen i biblioteket. Exportera skapar en ny fil med all data inbrändad i videons metadata.
                    </p>
                    {saveError && (
                      <p style={{ marginTop: '8px', color: '#c62828' }}>
                        {saveError}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="analysis-saved-panel">
                    <h4>Analysen är sparad</h4>
                    <p>Du kan nu öppna videon igen och samma analys kommer att visas.</p>
                    <div className="analysis-saved-actions">
                      <button type="button" onClick={() => navigate(`/${getHomeSelectionSearch() ? `?${getHomeSelectionSearch()}` : ''}`)}>
                        Öva och spela in igen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="analyze-step-actions">
              <button type="button" onClick={goToPreviousStep} disabled={stepIndex === 0}>
                ← Föregående
              </button>
              {currentStep === 'save' ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={quickSaveAnalysis}
                    disabled={isSaved || isExporting}
                    title="Spara analysen i biblioteket utan att ladda ned"
                  >
                    {isExporting ? 'Sparar...' : '💾 Spara lokalt'}
                  </button>
                  <button
                    type="button"
                    onClick={saveAnalysis}
                    className="analyze-save-cta"
                    disabled={isSaved || isExporting}
                    title="Exportera videon med metadata och ladda ned"
                  >
                    {isSaved ? 'Exporterad' : isExporting ? 'Exporterar...' : '⬇️ Exportera & Ladda ned'}
                  </button>
                </div>
              ) : (
                <button type="button" onClick={goToNextStep} disabled={stepIndex === stepOrder.length - 1}>
                  Nästa →
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