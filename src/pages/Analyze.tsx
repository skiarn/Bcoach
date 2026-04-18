import { useState, useRef, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import VideoPlayer from '../components/VideoPlayer.tsx'
import DrawingCanvas from '../components/DrawingCanvas.tsx'
import ShapeOverlay from '../components/ShapeOverlay.tsx'
import FeedbackPanel from '../components/FeedbackPanel.tsx'
import PlaybackToolbar from '../components/PlaybackToolbar.tsx'
import DrawingToolbar from '../components/DrawingToolbar.tsx'
import AppNav from '../components/AppNav.tsx'
import EditTimeline from '../components/EditTimeline.tsx'
import SkillPicker from '../components/SkillPicker.tsx'
import { findSkill, findSkillById, getSkills, Skill } from '../utils/skills.ts'
import { getVideoDisplayName } from '../utils/helpers.ts'
import { AnalysisSegment, EmbeddedAnalysisMetadata, Shape } from '../types/analysis.ts'
import { appendMetadataToVideo, buildAnalyzedVideoFileName } from '../utils/videoMetadata.ts'
import { addExportedVideoBlob, getVideoLibraryRecord, upsertVideoRecord } from '../services/videoLibrary.ts'
import { DEFAULT_SPORT_ID, getSportLabel } from '../utils/sports.ts'
import { useI18n } from '../i18n/I18nProvider.tsx'
import { useVideoSegments } from '../hooks/useVideoSegments.ts'
import { useDeviceType } from '../hooks/useDeviceType.ts'
import { applyVideoEdits } from '../utils/videoEditExport.ts'
import { deriveLegacyFeedbackFromSegments, deriveLegacyNextStepsFromSegments } from '../utils/analysisMetadata.ts'

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
  const deviceType = useDeviceType()
  const isMobile = deviceType === 'mobile'
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
  const { segments, addSegment, updateSegment, removeSegment, clearSegments, replaceSegments } = useVideoSegments()
  const [analysisSegments, setAnalysisSegments] = useState<AnalysisSegment[]>([])
  const [selectedAnalysisSegmentId, setSelectedAnalysisSegmentId] = useState<string | null>(null)

  const createSegmentFeedback = (feedbackItems: string[], nextStepItems: string[]) => ({
    checklist: feedbackItems,
    notes: [],
    nextSteps: nextStepItems,
  })

  const toSortedAnalysisSegments = (nextSegments: AnalysisSegment[]): AnalysisSegment[] =>
    [...nextSegments]
      .sort((a, b) => a.startTime - b.startTime)
      .map((segment, index) => ({
        ...segment,
        attemptIndex: index + 1,
      }))

  const syncSegmentFeedbackDefaults = (
    nextSegments: AnalysisSegment[],
    feedbackItems: string[],
    nextStepItems: string[]
  ): AnalysisSegment[] =>
    nextSegments.map((segment) => {
      const hasUserSegmentFeedback =
        segment.feedback.checklist.length > 0 ||
        segment.feedback.notes.length > 0 ||
        segment.feedback.nextSteps.length > 0

      if (hasUserSegmentFeedback) {
        return segment
      }

      return {
        ...segment,
        feedback: createSegmentFeedback(feedbackItems, nextStepItems),
      }
    })

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
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [videoDisplayWidth, setVideoDisplayWidth] = useState(0)
  const [videoDisplayHeight, setVideoDisplayHeight] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [showDrawingCanvas, setShowDrawingCanvas] = useState(false)
  const [workspaceMode, setWorkspaceMode] = useState<'draw' | 'segments'>('segments')
  const [tool, setTool] = useState<Tool>("line");
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null)
  const [drawingColor, setDrawingColor] = useState('#ff0000')
  const [drawingStrokeWidth, setDrawingStrokeWidth] = useState(2)
  const [drawingOpacity, setDrawingOpacity] = useState(1)
  const [customFeedback, setCustomFeedback] = useState<string[]>([])
  const [customNextSteps, setCustomNextSteps] = useState<string[]>([])
  const [isSaved, setIsSaved] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [segmentSkillType, setSegmentSkillType] = useState<string>(derivedSkill?.sportId ?? DEFAULT_SPORT_ID)
  const [segmentSkillName, setSegmentSkillName] = useState<string>(derivedSkill?.name ?? '')
  const [followPlayback, setFollowPlayback] = useState(true)
  const SEGMENT_TIME_EPSILON = 0.08

  const fallbackFeedbackValues =
    customFeedback.length > 0 ? customFeedback : (existingAnalysis?.feedback ?? embeddedMetadata?.feedback ?? [])

  const selectedAnalysisSegment = useMemo(
    () => analysisSegments.find((segment) => segment.id === selectedAnalysisSegmentId) ?? null,
    [analysisSegments, selectedAnalysisSegmentId]
  )

  const playbackActiveSegment = useMemo(() => {
    if (analysisSegments.length === 0) {
      return null
    }

    const matchingSegments = analysisSegments.filter(
      (segment) =>
        currentTime + SEGMENT_TIME_EPSILON >= segment.startTime &&
        currentTime - SEGMENT_TIME_EPSILON <= segment.endTime
    )

    return matchingSegments.length > 0 ? matchingSegments[matchingSegments.length - 1] : null
  }, [analysisSegments, currentTime])

  const playbackActiveSegmentId = playbackActiveSegment?.id ?? null

  const initialFeedbackValues = selectedAnalysisSegment?.feedback.checklist ?? fallbackFeedbackValues

  const rawVideoName = videoFile instanceof File
    ? videoFile.name
    : (location.state?.videoName || existingAnalysis?.videoName)

  const skill = derivedSkill

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
    setAnalysisSegments([])
    replaceSegments([])
  }, [existingAnalysis, replaceSegments])

  useEffect(() => {
    if (existingAnalysis || !embeddedMetadata) return

    console.log('[Analyze] Loading from embeddedMetadata:', embeddedMetadata)
    setShapes(embeddedMetadata.shapes ?? [])
    setCustomFeedback(embeddedMetadata.feedback ?? [])
    setCustomNextSteps(embeddedMetadata.nextSteps ?? [])

    const incomingAnalysisSegments: AnalysisSegment[] =
      'analysisSegments' in embeddedMetadata && Array.isArray(embeddedMetadata.analysisSegments)
        ? embeddedMetadata.analysisSegments
        : []
    setAnalysisSegments(toSortedAnalysisSegments(incomingAnalysisSegments))

    replaceSegments(
      incomingAnalysisSegments.map((segment: AnalysisSegment) => ({
        id: segment.id,
        startTime: segment.startTime,
        endTime: segment.endTime,
        action: 'feedback',
      }))
    )
  }, [embeddedMetadata, existingAnalysis, replaceSegments])

  // Debug: Log when embeddedMetadata changes
  useEffect(() => {
    if (embeddedMetadata) {
      console.log('[Analyze] embeddedMetadata available:', {
        shapes: embeddedMetadata.shapes?.length ?? 0,
        feedback: embeddedMetadata.feedback?.length ?? 0,
        nextSteps: embeddedMetadata.nextSteps?.length ?? 0,
        analysisSegments:
          'analysisSegments' in embeddedMetadata && Array.isArray(embeddedMetadata.analysisSegments)
            ? embeddedMetadata.analysisSegments.length
            : 0,
      })
    }
  }, [embeddedMetadata])

  useEffect(() => {
    setAnalysisSegments((previous) => {
      if (previous.length === 0) {
        return previous
      }

      const next = syncSegmentFeedbackDefaults(previous, customFeedback, customNextSteps)
      const changed = next.some((segment, index) => {
        const prevSegment = previous[index]
        return (
          prevSegment.feedback.checklist.length !== segment.feedback.checklist.length ||
          prevSegment.feedback.notes.length !== segment.feedback.notes.length ||
          prevSegment.feedback.nextSteps.length !== segment.feedback.nextSteps.length
        )
      })

      return changed ? toSortedAnalysisSegments(next) : previous
    })
  }, [customFeedback, customNextSteps])

  useEffect(() => {
    if (analysisSegments.length === 0) {
      setSelectedAnalysisSegmentId(null)
      return
    }

    if (!selectedAnalysisSegmentId || !analysisSegments.some((segment) => segment.id === selectedAnalysisSegmentId)) {
      setSelectedAnalysisSegmentId(analysisSegments[0].id)
    }
  }, [analysisSegments, selectedAnalysisSegmentId])

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
    if (workspaceMode === 'draw' && !showDrawingCanvas) {
      setShowDrawingCanvas(true)
    }

    if (workspaceMode === 'segments' && showDrawingCanvas) {
      setShowDrawingCanvas(false)
    }

    if (workspaceMode === 'segments' && document.fullscreenElement === videoContainerRef.current) {
      void document.exitFullscreen().catch(() => {
        // Ignore exit fullscreen failure when leaving draw mode.
      })
    }
  }, [showDrawingCanvas, workspaceMode])

  const segmentAvailableSkills = useMemo(
    () => getSkills(locale).filter((entry) => entry.sportId === segmentSkillType),
    [locale, segmentSkillType]
  )

  const selectedSegmentSkill = useMemo(
    () => segmentAvailableSkills.find((entry) => entry.name === segmentSkillName),
    [segmentAvailableSkills, segmentSkillName]
  )

  useEffect(() => {
    if (!selectedAnalysisSegment) {
      setSegmentSkillType(derivedSkill?.sportId ?? DEFAULT_SPORT_ID)
      setSegmentSkillName(derivedSkill?.name ?? '')
      return
    }

    const segmentSkill = findSkillById(selectedAnalysisSegment.skillId, locale) ??
      getSkills(locale).find((entry) => entry.name === selectedAnalysisSegment.skillName)

    setSegmentSkillType(segmentSkill?.sportId ?? derivedSkill?.sportId ?? DEFAULT_SPORT_ID)
    setSegmentSkillName(segmentSkill?.name ?? selectedAnalysisSegment.skillName ?? '')
  }, [selectedAnalysisSegment, locale, derivedSkill?.sportId, derivedSkill?.name])

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

  const handleAddAnalysisSegment = (startTime: number, endTime: number): string => {
    const id = addSegment(startTime, endTime)
    updateSegment(id, { action: 'feedback', speedFactor: undefined })
    setSelectedAnalysisSegmentId(id)

    setAnalysisSegments((previous) =>
      toSortedAnalysisSegments([
        ...previous,
        {
          id,
          startTime,
          endTime,
          skillId: selectedSegmentSkill?.id ?? skill?.id,
          skillName: selectedSegmentSkill?.name ?? skill?.name,
          attemptIndex: previous.length + 1,
          feedback: createSegmentFeedback(customFeedback, customNextSteps),
        },
      ])
    )

    return id
  }

  const handleUpdateAnalysisSegment = (
    id: string,
    changes: Parameters<typeof updateSegment>[1]
  ) => {
    updateSegment(id, changes)

    setAnalysisSegments((previous) =>
      toSortedAnalysisSegments(
        previous.map((segment) => {
          if (segment.id !== id) {
            return segment
          }

          const nextStart = typeof changes.startTime === 'number' ? changes.startTime : segment.startTime
          const nextEnd = typeof changes.endTime === 'number' ? changes.endTime : segment.endTime

          return {
            ...segment,
            startTime: Math.max(0, Math.min(nextStart, nextEnd)),
            endTime: Math.max(nextStart, nextEnd),
          }
        })
      )
    )
  }

  const handleRemoveAnalysisSegment = (id: string) => {
    removeSegment(id)
    setAnalysisSegments((previous) => toSortedAnalysisSegments(previous.filter((segment) => segment.id !== id)))
  }

  const handleClearAnalysisSegments = () => {
    clearSegments()
    setAnalysisSegments([])
    setSelectedAnalysisSegmentId(null)
  }

  const handleSelectAnalysisSegment = (segmentId: string, seekToStart = false) => {
    setSelectedAnalysisSegmentId(segmentId)

    if (!seekToStart) {
      return
    }

    const segment = analysisSegments.find((item) => item.id === segmentId)
    if (!segment) {
      return
    }

    handleSeek(segment.startTime)
    handlePause()
  }

  const handleSegmentFeedbackChange = (feedbackItems: string[]) => {
    setCustomFeedback(feedbackItems)

    if (!selectedAnalysisSegmentId) {
      return
    }

    setAnalysisSegments((previous) =>
      toSortedAnalysisSegments(
        previous.map((segment) => {
          if (segment.id !== selectedAnalysisSegmentId) {
            return segment
          }

          return {
            ...segment,
            feedback: {
              ...segment.feedback,
              checklist: feedbackItems,
            },
          }
        })
      )
    )
  }

  const handleSegmentSkillTypeChange = (nextSkillType: string) => {
    setSegmentSkillType(nextSkillType)

    const nextSkill = getSkills(locale).find((entry) => entry.sportId === nextSkillType && entry.name === segmentSkillName)
    if (!nextSkill) {
      setSegmentSkillName('')
    }

    if (!selectedAnalysisSegmentId) {
      return
    }

    setAnalysisSegments((previous) =>
      toSortedAnalysisSegments(
        previous.map((segment) => {
          if (segment.id !== selectedAnalysisSegmentId) {
            return segment
          }

          return {
            ...segment,
            skillId: nextSkill?.id,
            skillName: nextSkill?.name,
          }
        })
      )
    )
  }

  const handleSegmentSkillNameChange = (nextSkillName: string) => {
    setSegmentSkillName(nextSkillName)

    const nextSkill = getSkills(locale).find((entry) => entry.sportId === segmentSkillType && entry.name === nextSkillName)

    if (!selectedAnalysisSegmentId) {
      return
    }

    setAnalysisSegments((previous) =>
      toSortedAnalysisSegments(
        previous.map((segment) => {
          if (segment.id !== selectedAnalysisSegmentId) {
            return segment
          }

          return {
            ...segment,
            skillId: nextSkill?.id,
            skillName: nextSkill?.name,
          }
        })
      )
    )
  }

  const buildMetadata = (nextShapes: Shape[]): EmbeddedAnalysisMetadata => {
    const fallbackFeedback = embeddedMetadata?.feedback ?? existingAnalysis?.feedback ?? []
    const fallbackNextSteps = embeddedMetadata?.nextSteps ?? existingAnalysis?.nextSteps ?? []

    const feedback = customFeedback.length > 0 ? customFeedback : fallbackFeedback
    const nextSteps = customNextSteps.length > 0 ? customNextSteps : fallbackNextSteps

    const resolvedSegments = toSortedAnalysisSegments(
      syncSegmentFeedbackDefaults(analysisSegments, feedback, nextSteps).map((segment) => ({
        ...segment,
        skillId: segment.skillId ?? skill?.id,
        skillName: segment.skillName ?? skill?.name,
      }))
    )

    return {
      schemaVersion: 3,
      savedAt: Date.now(),
      sourceVideoName: videoName,
      sportId: skill?.sportId,
      skillId: skill?.id,
      skillName: skill?.name,
      skillType: skill?.sportId,
      shapes: nextShapes,
      feedback: resolvedSegments.length > 0 ? deriveLegacyFeedbackFromSegments(resolvedSegments) : feedback,
      nextSteps: resolvedSegments.length > 0 ? deriveLegacyNextStepsFromSegments(resolvedSegments) : nextSteps,
      analysisSegments: resolvedSegments,
    }
  }

  const handleSaveAnalysis = async (nextShapes: Shape[]) => {
    setSaveError(null)
    const metadata = buildMetadata(nextShapes)

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

  const deleteShapeById = (shapeId: string) => {
    setShapes((prev) => prev.filter((shape) => shape.id !== shapeId))
  }

  const deleteSelectedShape = () => {
    if (!selectedShapeId) return
    deleteShapeById(selectedShapeId)
  }

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

      const metadata = buildMetadata(nextShapes)

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
      handleClearAnalysisSegments()
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

  const showVideoWorkspace = true

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

  const renderSegmentSelector = (showPauseButton: boolean): JSX.Element | null => {
    if (analysisSegments.length === 0) {
      return (
        <p className="analyze-segment-selector__empty">
          {t('analyze.segmentSelector.empty')}
        </p>
      )
    }

    return (
      <div className="analyze-segment-selector">
        <p className="analyze-segment-selector__title">{t('analyze.segmentSelector.title')}</p>
        <div className="analyze-segment-selector__chips">
          {analysisSegments.map((segment, index) => {
            const isSelected = segment.id === selectedAnalysisSegmentId
            const isPlaybackActive = segment.id === playbackActiveSegmentId

            return (
              <button
                key={segment.id}
                type="button"
                onClick={() => handleSelectAnalysisSegment(segment.id)}
                className={`analyze-segment-selector__chip ${isSelected ? 'selected' : ''} ${isPlaybackActive ? 'active' : ''}`.trim()}
              >
                {t('analyze.segmentSelector.item', {
                  index: index + 1,
                  start: formatTime(segment.startTime),
                  end: formatTime(segment.endTime),
                })}
              </button>
            )
          })}
        </div>

        <div className="analyze-segment-selector__controls">
          <button
            type="button"
            className={`analyze-segment-selector__btn analyze-segment-selector__btn--follow ${followPlayback ? 'active' : ''}`.trim()}
            aria-pressed={followPlayback}
            onClick={() => setFollowPlayback((previous) => !previous)}
          >
            {t('analyze.segmentSelector.followPlayback')}
          </button>

          {showPauseButton && selectedAnalysisSegment && (
            <button
              type="button"
              className="analyze-segment-selector__btn analyze-segment-selector__btn--pause"
              onClick={() => handleSelectAnalysisSegment(selectedAnalysisSegment.id, true)}
            >
              {t('analyze.segmentSelector.pauseAt', {
                time: formatTime(selectedAnalysisSegment.startTime),
              })}
            </button>
          )}
        </div>
      </div>
    )
  }

  const renderInlineSegmentFeedbackEditor = (): JSX.Element | null => {
    if (workspaceMode !== 'segments') {
      return null
    }

    const shouldShowLivePlaybackFeedback = followPlayback && isPlaying
    const feedbackDisplaySegment = followPlayback
      ? (playbackActiveSegment ?? selectedAnalysisSegment)
      : selectedAnalysisSegment
    const feedbackItems = feedbackDisplaySegment
      ? [...feedbackDisplaySegment.feedback.checklist, ...feedbackDisplaySegment.feedback.notes]
      : []

    return (
      <div className="analyze-inline-segment-feedback">
        {renderSegmentSelector(true)}

        {selectedAnalysisSegment && (
          <div className="analyze-segment-skill-picker">
            <SkillPicker
              label={t('home.skillPickerLabel')}
              selectedSkillType={segmentSkillType}
              selectedSkillName={segmentSkillName}
              onSkillTypeChange={handleSegmentSkillTypeChange}
              onSkillNameChange={handleSegmentSkillNameChange}
              allowDeselect={true}
              collapseTypeSelectorWhenSelected={true}
              helperText={t('analyze.nextSteps.skillLabel')}
              className="analyze-segment-skill-picker__inner"
            />
          </div>
        )}

        {shouldShowLivePlaybackFeedback ? (
          <section className="analyze-live-feedback" aria-live="polite">
            {feedbackDisplaySegment ? (
              <>
                <p className="analyze-live-feedback__label">
                  {t('analyze.segmentSelector.item', {
                    index: feedbackDisplaySegment.attemptIndex,
                    start: formatTime(feedbackDisplaySegment.startTime),
                    end: formatTime(feedbackDisplaySegment.endTime),
                  })}
                </p>

                <div className="analyze-live-feedback__columns">
                  <div>
                    <h4>{t('feedback.title')}</h4>
                    {feedbackItems.length > 0 ? (
                      <ul>
                        {feedbackItems.map((item, index) => (
                          <li key={`${feedbackDisplaySegment.id}-feedback-${index}`}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>{t('history.feedbackEmpty')}</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="analyze-live-feedback__empty">{t('analyze.segmentSelector.empty')}</p>
            )}
          </section>
        ) : selectedAnalysisSegment ? (
          <FeedbackPanel
            skill={selectedSegmentSkill}
            mode="feedback"
            initialFeedback={selectedAnalysisSegment.feedback.checklist}
            onFeedbackChange={handleSegmentFeedbackChange}
          />
        ) : null}
      </div>
    )
  }

  return (
    <div className={`analyze ${showDrawingCanvas ? 'analyze--drawing-mobile-open' : ''}`}>
      <AppNav />
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={onBack}>← {t('common.back')}</button>
        <h1>{t('analyze.title', { videoName })}</h1>
        <div></div>
      </header>

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
          </div>

          <div className="analyze-workspace-controls">
            <PlaybackToolbar
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              onPlay={handlePlay}
              onPause={handlePause}
              onSeek={handleSeek}
              videoLoaded={videoLoaded}
              onToggleFullscreen={handleToggleFullscreen}
              isFullscreen={isFullscreen}
            />

            <div className="analyze-workspace-mode" role="tablist" aria-label="Workspace mode">
              <button
                type="button"
                role="tab"
                aria-selected={workspaceMode === 'segments'}
                className={workspaceMode === 'segments' ? 'active' : ''}
                onClick={() => {
                  setWorkspaceMode('segments')
                  setShowDrawingCanvas(false)
                }}
              >
                {t('analyze.edit.title')}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={workspaceMode === 'draw'}
                className={workspaceMode === 'draw' ? 'active' : ''}
                onClick={() => {
                  setWorkspaceMode('draw')
                  setShowDrawingCanvas(true)
                }}
              >
                {t('analyze.step1')}
              </button>
            </div>
          </div>

          {workspaceMode === 'segments' && videoLoaded && duration > 0 && (
            <div className={isMobile ? 'shape-timeline-editor' : 'analyze-inline-segment-editor'} style={isMobile ? { marginTop: '14px' } : undefined}>
              {isMobile && (
                <>
                  <h3>{t('analyze.edit.title')}</h3>
                  <p style={{ marginTop: '6px', color: '#555' }}>{t('analyze.edit.help')}</p>
                </>
              )}

              <EditTimeline
                duration={duration}
                currentTime={currentTime}
                segments={segments}
                selectedSegmentId={selectedAnalysisSegmentId}
                onSelectSegment={(segmentId) => {
                  if (segmentId) {
                    handleSelectAnalysisSegment(segmentId)
                  }
                }}
                showFeedbackAction={true}
                onAddSegment={handleAddAnalysisSegment}
                onUpdateSegment={handleUpdateAnalysisSegment}
                onRemoveSegment={handleRemoveAnalysisSegment}
                onSeek={handleSeek}
              />

              <div className="analyze-inline-segment-actions">
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
                  onClick={handleClearAnalysisSegments}
                  disabled={segments.length === 0 || isApplyingEdits}
                >
                  {t('editor.clearSegments')}
                </button>
              </div>

              {editError && (
                <p className="analyze-inline-error">{editError}</p>
              )}

              {renderInlineSegmentFeedbackEditor()}
            </div>
          )}

          {workspaceMode === 'draw' && showDrawingCanvas && isMobile && (
            <DrawingToolbar
              selectedTool={tool === 'none' ? 'none' : (tool as 'line' | 'circle' | 'rectangle' | 'arrow' | 'eraser' | 'none')}
              onToolChange={(newTool) => {
                if (newTool === 'none') {
                  setTool('none')
                } else if (newTool === 'eraser') {
                  setTool('none')
                } else {
                  setTool(newTool as 'line' | 'circle' | 'none')
                }
              }}
              onDeleteSelected={deleteSelectedShape}
              canDeleteSelected={Boolean(selectedShapeId)}
              color={drawingColor}
              onColorChange={setDrawingColor}
              strokeWidth={drawingStrokeWidth}
              onStrokeWidthChange={setDrawingStrokeWidth}
              opacity={drawingOpacity}
              onOpacityChange={setDrawingOpacity}
            />
          )}

          {workspaceMode === 'draw' && showDrawingCanvas && !isMobile && (
            <div className="analyze-inline-draw-editor">
              <div className="analyze-inline-tools" role="toolbar" aria-label="Drawing tools">
                <button
                  type="button"
                  className={tool === 'line' ? 'active' : ''}
                  onClick={() => setTool('line')}
                >
                  {t('analyze.tool.line')}
                </button>
                <button
                  type="button"
                  className={tool === 'circle' ? 'active' : ''}
                  onClick={() => setTool('circle')}
                >
                  {t('analyze.tool.circle')}
                </button>
                <button
                  type="button"
                  className={tool === 'none' ? 'active' : ''}
                  onClick={() => setTool('none')}
                >
                  {t('analyze.tool.none')}
                </button>
                <button
                  type="button"
                  onClick={deleteSelectedShape}
                  disabled={!selectedShapeId}
                >
                  {t('analyze.tool.delete')}
                </button>
              </div>

              {shapes.length > 0 && (
                <div className="analyze-inline-draw-range-editor">
                  <h4>{t('analyze.timeline.title')}</h4>

                  <div className="shape-selector-list">
                    {shapes.map((shape, index) => (
                      <div key={shape.id} className="shape-chip">
                        <button
                          type="button"
                          className={`shape-chip__select ${selectedShapeId === shape.id ? 'active' : ''}`}
                          onClick={() => setSelectedShapeId(shape.id)}
                        >
                          {shape.type === 'line' ? t('analyze.tool.line') : t('analyze.tool.circle')} #{index + 1}
                        </button>
                        <button
                          type="button"
                          className="shape-chip__delete"
                          onClick={() => deleteShapeById(shape.id)}
                          aria-label={`${t('analyze.tool.delete')} ${index + 1}`}
                          title={t('analyze.tool.delete')}
                        >
                          <span aria-hidden="true">🗑</span>
                        </button>
                      </div>
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
            </div>
          )}

          {workspaceMode === 'draw' && showDrawingCanvas && isMobile && shapes.length > 0 && (
            <div className="shape-timeline-editor">
              <h3>{t('analyze.timeline.title')}</h3>

              <div className="shape-selector-list">
                {shapes.map((shape, index) => (
                  <div key={shape.id} className="shape-chip">
                    <button
                      type="button"
                      className={`shape-chip__select ${selectedShapeId === shape.id ? 'active' : ''}`}
                      onClick={() => setSelectedShapeId(shape.id)}
                    >
                      {shape.type === 'line' ? t('analyze.tool.line') : t('analyze.tool.circle')} #{index + 1}
                    </button>
                    <button
                      type="button"
                      className="shape-chip__delete"
                      onClick={() => deleteShapeById(shape.id)}
                      aria-label={`${t('analyze.tool.delete')} ${index + 1}`}
                      title={t('analyze.tool.delete')}
                    >
                      <span aria-hidden="true">🗑</span>
                    </button>
                  </div>
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


          </div>
        )}

        <div style={{ width: '100%', marginTop: showVideoWorkspace ? '16px' : '0' }}>
          <div className="analyze-step-panel">
            <div className="analyze-step-actions">
              <button type="button" onClick={onBack}>
                ← {t('common.back')}
              </button>
              <button
                type="button"
                onClick={quickSaveAnalysis}
                disabled={isExporting}
                title={t('analyze.quickSave.title')}
              >
                {isExporting ? t('analyze.saving') : `💾 ${t('analyze.quickSave')}`}
              </button>
              <button
                type="button"
                onClick={saveAnalysis}
                className="analyze-save-cta"
                disabled={isExporting}
                title={t('analyze.export.title')}
              >
                {isSaved ? t('analyze.exported') : isExporting ? t('analyze.exporting') : `⬇️ ${t('analyze.export')}`}
              </button>
              <button type="button" onClick={handleNavigateToHome}>
                {t('analyze.saved.cta')}
              </button>
            </div>

            {saveError && <p className="analyze-inline-error">{saveError}</p>}

            <p style={{ marginTop: '10px', color: '#475569' }}>
              {t('analyze.save.feedbackPoints', {
                count: analysisSegments.length > 0
                  ? deriveLegacyFeedbackFromSegments(analysisSegments).length
                  : initialFeedbackValues.length,
              })}
            </p>

            {isSaved && (
              <p style={{ marginTop: '6px', color: '#166534', fontWeight: 600 }}>
                {t('analyze.saved.title')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analyze