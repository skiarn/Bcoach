import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import useLocalStorage from '../hooks/useLocalStorage.ts'
import ShapeOverlay from '../components/ShapeOverlay.tsx'
import Controls from '../components/Controls.tsx'
import AppNav from '../components/AppNav.tsx'
import { getVideoDisplayName } from '../utils/helpers.ts'

interface Shape {
  id?: string
  type: 'line' | 'circle'
  startX: number
  startY: number
  endX: number
  endY: number
  sourceWidth?: number
  sourceHeight?: number
  visibleFrom?: number
  visibleTo?: number
}

interface VideoAnalysis {
  id: string
  videoUrl: string
  videoName: string
  shapes: Shape[]
  feedback: string[]
  nextSteps?: string[]
  timestamp: number
  skillName?: string
  skillType?: string
}

type DashboardRange = '7d' | '30d' | 'all'

function History(): JSX.Element {
  const navigate = useNavigate()
  const [analyses, setAnalyses] = useLocalStorage<VideoAnalysis[]>('beach-volley-analyses', [])
  const [selectedAnalysis, setSelectedAnalysis] = useState<VideoAnalysis | null>(null)
  const detailContainerRef = useRef<HTMLDivElement | null>(null)
  const detailVideoRef = useRef<HTMLVideoElement | null>(null)
  const [detailCurrentTime, setDetailCurrentTime] = useState(0)
  const [detailDuration, setDetailDuration] = useState(0)
  const [detailIsPlaying, setDetailIsPlaying] = useState(false)
  const [detailPlaybackRate, setDetailPlaybackRate] = useState(1)
  const [detailVideoWidth, setDetailVideoWidth] = useState(0)
  const [detailVideoHeight, setDetailVideoHeight] = useState(0)
  const [isDetailFullscreen, setIsDetailFullscreen] = useState(false)
  const [analysisToDelete, setAnalysisToDelete] = useState<VideoAnalysis | null>(null)
  const [dashboardRange, setDashboardRange] = useState<DashboardRange>('30d')

  useEffect(() => {
    if (!selectedAnalysis) {
      setDetailCurrentTime(0)
      setDetailDuration(0)
      setDetailIsPlaying(false)
      setDetailVideoWidth(0)
      setDetailVideoHeight(0)
    }
  }, [selectedAnalysis])

  const updateVideoOverlaySize = () => {
    if (!detailVideoRef.current) return
    setDetailVideoWidth(detailVideoRef.current.offsetWidth)
    setDetailVideoHeight(detailVideoRef.current.offsetHeight)
  }

  const handleDetailPlay = () => {
    if (!detailVideoRef.current) return
    void detailVideoRef.current.play().catch(() => setDetailIsPlaying(false))
  }

  const handleDetailPause = () => {
    if (!detailVideoRef.current) return
    detailVideoRef.current.pause()
  }

  const handleDetailSeek = (time: number) => {
    if (!detailVideoRef.current) return
    detailVideoRef.current.currentTime = time
    setDetailCurrentTime(time)
  }

  const handleDetailSpeedChange = (speed: number) => {
    if (!detailVideoRef.current) return
    detailVideoRef.current.playbackRate = speed
    setDetailPlaybackRate(speed)
  }

  const toggleDetailFullscreen = async () => {
    try {
      if (document.fullscreenElement === detailContainerRef.current) {
        await document.exitFullscreen()
        return
      }

      if (!document.fullscreenElement && detailContainerRef.current) {
        await detailContainerRef.current.requestFullscreen()
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error)
    }
  }

  useEffect(() => {
    if (!selectedAnalysis) return

    window.addEventListener('resize', updateVideoOverlaySize)
    const handleFullscreenChange = () => {
      setIsDetailFullscreen(document.fullscreenElement === detailContainerRef.current)
      updateVideoOverlaySize()
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)

    const video = detailVideoRef.current
    let resizeObserver: ResizeObserver | null = null
    if (video && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateVideoOverlaySize()
      })
      resizeObserver.observe(video)
    }

    const timeoutId = window.setTimeout(updateVideoOverlaySize, 0)

    return () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener('resize', updateVideoOverlaySize)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      resizeObserver?.disconnect()
    }
  }, [selectedAnalysis])

  const normalizeShapes = (analysis: VideoAnalysis): Shape[] => {
    return analysis.shapes.map((shape, index) => ({
      ...shape,
      id: shape.id ?? `${analysis.id}-${index}`,
    }))
  }

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getAnalysisTitle = (analysis: VideoAnalysis): string => {
    return getVideoDisplayName(analysis.videoName, analysis.timestamp)
  }

  const handleDeleteAnalysis = (analysisId: string) => {
    setAnalyses(analyses.filter((analysis) => analysis.id !== analysisId))
    setSelectedAnalysis(null)
    setAnalysisToDelete(null)
  }

  const handleEditAnalysis = (analysis: VideoAnalysis) => {
    navigate('/analyze', {
      state: {
        videoUrl: analysis.videoUrl,
        videoName: analysis.videoName,
        analysis,
        analysisId: analysis.id,
      },
    })
  }

  const getSkillTypeLabel = (skillType?: string): string => {
    if (skillType === 'beachvolley') return 'Beachvolley'
    if (skillType === 'volleyboll') return 'Volleyboll'
    return 'Utan vald sport'
  }

  const groupedAnalyses = analyses.reduce<Record<string, Record<string, VideoAnalysis[]>>>((acc, analysis) => {
    const typeKey = getSkillTypeLabel(analysis.skillType)
    const skillKey = analysis.skillName?.trim() || 'Utan vald teknik'

    if (!acc[typeKey]) {
      acc[typeKey] = {}
    }

    if (!acc[typeKey][skillKey]) {
      acc[typeKey][skillKey] = []
    }

    acc[typeKey][skillKey].push(analysis)
    return acc
  }, {})

  const typeOrder = ['Beachvolley', 'Volleyboll', 'Utan vald sport']

  const nowTimestamp = Date.now()
  const rangeStartTimestamp =
    dashboardRange === '7d'
      ? nowTimestamp - (7 * 24 * 60 * 60 * 1000)
      : dashboardRange === '30d'
        ? nowTimestamp - (30 * 24 * 60 * 60 * 1000)
        : 0

  const dashboardAnalyses = dashboardRange === 'all'
    ? analyses
    : analyses.filter((analysis) => analysis.timestamp >= rangeStartTimestamp)

  const getDayKey = (timestamp: number): string => {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const sortedAnalyses = [...dashboardAnalyses].sort((a, b) => a.timestamp - b.timestamp)
  const totalSessions = dashboardAnalyses.length
  const totalFeedbackPoints = dashboardAnalyses.reduce((sum, analysis) => sum + analysis.feedback.length, 0)
  const totalNextSteps = dashboardAnalyses.reduce((sum, analysis) => sum + (analysis.nextSteps?.length ?? 0), 0)
  const avgFeedbackPerSession = totalSessions > 0 ? totalFeedbackPoints / totalSessions : 0
  const avgNextStepsPerSession = totalSessions > 0 ? totalNextSteps / totalSessions : 0

  const rangeLabel = dashboardRange === '7d' ? '7 dagar' : dashboardRange === '30d' ? '30 dagar' : 'Alla'

  const sessionDaySet = new Set(dashboardAnalyses.map((analysis) => getDayKey(analysis.timestamp)))
  let streakDays = 0
  const streakDate = new Date()
  while (true) {
    const key = getDayKey(streakDate.getTime())
    if (!sessionDaySet.has(key)) break
    streakDays += 1
    streakDate.setDate(streakDate.getDate() - 1)
  }

  const xp = (totalSessions * 100) + (totalFeedbackPoints * 5) + (totalNextSteps * 15)
  const xpPerLevel = 500
  const currentLevel = Math.max(1, Math.floor(xp / xpPerLevel) + 1)
  const currentLevelFloor = (currentLevel - 1) * xpPerLevel
  const nextLevelTarget = currentLevel * xpPerLevel
  const levelProgress = Math.max(0, Math.min(100, ((xp - currentLevelFloor) / xpPerLevel) * 100))

  const badges = [
    { id: 'first', label: 'Forsta passet', unlocked: totalSessions >= 1 },
    { id: 'weekly', label: 'Veckans slitare', unlocked: dashboardAnalyses.filter((analysis) => analysis.timestamp >= (nowTimestamp - (7 * 24 * 60 * 60 * 1000))).length >= 5 },
    { id: 'streak', label: 'Streak 3 dagar', unlocked: streakDays >= 3 },
    { id: 'reflect', label: 'Djup analys', unlocked: avgFeedbackPerSession >= 4 },
    { id: 'veteran', label: 'Video-veteran', unlocked: totalSessions >= 15 },
  ]

  const feedbackTopicCount = new Map<string, number>()
  dashboardAnalyses.forEach((analysis) => {
    analysis.feedback.forEach((item) => {
      const key = item.trim()
      if (!key) return
      feedbackTopicCount.set(key, (feedbackTopicCount.get(key) ?? 0) + 1)
    })
  })

  const topFeedbackTopics = Array.from(feedbackTopicCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const maxTopicCount = topFeedbackTopics[0]?.[1] ?? 1

  const trendByDay = new Map<string, { dayKey: string; label: string; feedback: number; sessions: number; nextSteps: number }>()
  sortedAnalyses.forEach((analysis) => {
    const dayKey = getDayKey(analysis.timestamp)
    const existing = trendByDay.get(dayKey)
    const label = new Date(analysis.timestamp).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })
    if (existing) {
      existing.feedback += analysis.feedback.length
      existing.sessions += 1
      existing.nextSteps += analysis.nextSteps?.length ?? 0
      return
    }

    trendByDay.set(dayKey, {
      dayKey,
      label,
      feedback: analysis.feedback.length,
      sessions: 1,
      nextSteps: analysis.nextSteps?.length ?? 0,
    })
  })

  const trendPoints = Array.from(trendByDay.values())
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey))
    .slice(-8)
  const trendMaxFeedback = trendPoints.reduce((max, point) => Math.max(max, point.feedback), 1)

  const skillProgressMap = new Map<string, {
    typeLabel: string
    skillName: string
    sessions: number
    feedbackTotal: number
    nextStepsTotal: number
    latestTimestamp: number
  }>()

  dashboardAnalyses.forEach((analysis) => {
    const typeLabel = getSkillTypeLabel(analysis.skillType)
    const skillName = analysis.skillName?.trim() || 'Utan vald teknik'
    const key = `${typeLabel}::${skillName}`
    const existing = skillProgressMap.get(key)
    if (existing) {
      existing.sessions += 1
      existing.feedbackTotal += analysis.feedback.length
      existing.nextStepsTotal += analysis.nextSteps?.length ?? 0
      existing.latestTimestamp = Math.max(existing.latestTimestamp, analysis.timestamp)
      return
    }

    skillProgressMap.set(key, {
      typeLabel,
      skillName,
      sessions: 1,
      feedbackTotal: analysis.feedback.length,
      nextStepsTotal: analysis.nextSteps?.length ?? 0,
      latestTimestamp: analysis.timestamp,
    })
  })

  const skillProgress = Array.from(skillProgressMap.values())
    .sort((a, b) => b.sessions - a.sessions || b.latestTimestamp - a.latestTimestamp)

  if (selectedAnalysis) {
    return (
      <div className="analysis-detail">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={() => setSelectedAnalysis(null)}>← Tillbaka</button>
          <h1>{getAnalysisTitle(selectedAnalysis)}</h1>
          <div></div>
        </header>

        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <div
              ref={detailContainerRef}
              className={`video-stage ${isDetailFullscreen ? 'is-fullscreen' : ''}`}
            >
              <video
                ref={detailVideoRef}
                src={selectedAnalysis.videoUrl}
                style={{
                  width: '100%',
                  height: isDetailFullscreen ? '100%' : 'auto',
                  maxWidth: isDetailFullscreen ? 'none' : '640px',
                  objectFit: 'contain',
                  display: 'block',
                }}
                onTimeUpdate={(e) => setDetailCurrentTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => {
                  const d = e.currentTarget.duration
                  if (Number.isFinite(d) && d > 0) setDetailDuration(d)
                  updateVideoOverlaySize()
                }}
                onPlay={() => setDetailIsPlaying(true)}
                onPause={() => setDetailIsPlaying(false)}
                onEnded={() => setDetailIsPlaying(false)}
              />

              {detailVideoWidth > 0 && detailVideoHeight > 0 && (
                <ShapeOverlay
                  width={detailVideoWidth}
                  height={detailVideoHeight}
                  currentTime={detailCurrentTime}
                  shapes={normalizeShapes(selectedAnalysis)}
                />
              )}

              <div className="video-controls-overlay">
                <Controls
                  isPlaying={detailIsPlaying}
                  playbackRate={detailPlaybackRate}
                  currentTime={detailCurrentTime}
                  duration={detailDuration}
                  onPlay={handleDetailPlay}
                  onPause={handleDetailPause}
                  onSpeedChange={handleDetailSpeedChange}
                  onSeek={handleDetailSeek}
                  videoLoaded={detailVideoWidth > 0}
                  onToggleFullscreen={toggleDetailFullscreen}
                  isFullscreen={isDetailFullscreen}
                />
              </div>
            </div>
          </div>

          <div style={{ width: '300px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button className="history-action-btn history-action-btn--edit" onClick={() => handleEditAnalysis(selectedAnalysis)}>
                ✏️ Redigera / Analysera igen
              </button>
              <button
                className="history-action-btn history-action-btn--delete"
                onClick={() => setAnalysisToDelete(selectedAnalysis)}
              >
                🗑 Ta bort
              </button>
            </div>

            {selectedAnalysis.skillName && (
              <div className="feedback-skill-badge" style={{ marginBottom: '16px' }}>
                🏐 {selectedAnalysis.skillName}
                {selectedAnalysis.skillType && <span className="feedback-skill-type"> ({selectedAnalysis.skillType})</span>}
              </div>
            )}

            <h3>📋 Feedback ({selectedAnalysis.feedback.length} tips)</h3>
            <ul>
              {selectedAnalysis.feedback.map((tip, index) => (
                <li key={index} style={{ marginBottom: '10px' }}>{tip}</li>
              ))}
            </ul>

            {selectedAnalysis.nextSteps && selectedAnalysis.nextSteps.length > 0 && (
              <>
                <h3>🎯 Nästa steg</h3>
                <ul>
                  {selectedAnalysis.nextSteps.map((step, index) => (
                    <li key={index} style={{ marginBottom: '10px' }}>{step}</li>
                  ))}
                </ul>
              </>
            )}

            <p style={{ fontSize: '0.9em', color: '#666', marginTop: '20px' }}>
              Analyserad: {formatDate(selectedAnalysis.timestamp)}
            </p>
          </div>
        </div>

        {analysisToDelete && (
          <div className="confirm-dialog-overlay" role="dialog" aria-modal="true">
            <div className="confirm-dialog">
              <h3>Ta bort analys?</h3>
              <p>
                Du är på väg att ta bort <strong>{getAnalysisTitle(analysisToDelete)}</strong>. Detta går inte att ångra.
              </p>
              <div className="confirm-dialog-actions">
                <button type="button" onClick={() => setAnalysisToDelete(null)}>
                  Avbryt
                </button>
                <button
                  type="button"
                  className="confirm-danger-btn"
                  onClick={() => handleDeleteAnalysis(analysisToDelete.id)}
                >
                  Ta bort
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="history">
      <AppNav />
      <header className="page-header">
        <h1>Mina videos</h1>
        <p>Folj din utveckling, jamfor analyser och bygg momentum over tid.</p>
      </header>

      {analyses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h2>Inga analyser än</h2>
          <p>Gör din första videoanalys för att komma igång!</p>
          <Link to="/" style={{ color: '#007bff', textDecoration: 'none' }}>
            Gå till startsidan →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '28px' }}>
          <section className="history-dashboard">
            <div className="history-range-filter" role="group" aria-label="Tidsperiod for statistik">
              <button
                type="button"
                className={dashboardRange === '7d' ? 'active' : ''}
                onClick={() => setDashboardRange('7d')}
              >
                7 dagar
              </button>
              <button
                type="button"
                className={dashboardRange === '30d' ? 'active' : ''}
                onClick={() => setDashboardRange('30d')}
              >
                30 dagar
              </button>
              <button
                type="button"
                className={dashboardRange === 'all' ? 'active' : ''}
                onClick={() => setDashboardRange('all')}
              >
                Alla
              </button>
            </div>

            <div className="history-stats-grid">
              <article className="history-stat-card">
                <p>Totala pass ({rangeLabel})</p>
                <h3>{totalSessions}</h3>
              </article>
              <article className="history-stat-card">
                <p>Feedbackpunkter ({rangeLabel})</p>
                <h3>{totalFeedbackPoints}</h3>
              </article>
              <article className="history-stat-card">
                <p>Feedback / pass</p>
                <h3>{avgFeedbackPerSession.toFixed(1)}</h3>
              </article>
              <article className="history-stat-card">
                <p>Nasta steg / pass</p>
                <h3>{avgNextStepsPerSession.toFixed(1)}</h3>
              </article>
            </div>

            <article className="history-level-card">
              <div className="history-level-top">
                <div>
                  <p className="history-level-label">Niva</p>
                  <h3>Level {currentLevel}</h3>
                </div>
                <div className="history-level-xp">{xp} XP</div>
              </div>
              <div className="history-level-progress-track">
                <div className="history-level-progress-fill" style={{ width: `${levelProgress}%` }} />
              </div>
              <p className="history-level-meta">{Math.max(0, nextLevelTarget - xp)} XP kvar till level {currentLevel + 1}</p>
              <div className="history-badge-row">
                {badges.map((badge) => (
                  <span key={badge.id} className={`history-badge ${badge.unlocked ? 'unlocked' : ''}`}>
                    {badge.unlocked ? '✓' : '•'} {badge.label}
                  </span>
                ))}
              </div>
            </article>

            <div className="history-analytics-grid">
              <article className="history-analytics-card">
                <h3>Feedback over tid</h3>
                {trendPoints.length > 0 ? (
                  <div className="history-trend-list">
                    {trendPoints.map((point) => (
                      <div key={point.dayKey} className="history-trend-row">
                        <span>{point.label}</span>
                        <div className="history-trend-bar-track">
                          <div
                            className="history-trend-bar-fill"
                            style={{ width: `${Math.max(8, (point.feedback / trendMaxFeedback) * 100)}%` }}
                          />
                        </div>
                        <strong>{point.feedback}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Ingen trenddata tillganglig an.</p>
                )}
              </article>

              <article className="history-analytics-card">
                <h3>Vanligaste feedbackpunkter</h3>
                {topFeedbackTopics.length > 0 ? (
                  <div className="history-topic-list">
                    {topFeedbackTopics.map(([topic, count]) => (
                      <div key={topic} className="history-topic-item">
                        <div className="history-topic-text">{topic}</div>
                        <div className="history-topic-track">
                          <div
                            className="history-topic-fill"
                            style={{ width: `${Math.max(10, (count / maxTopicCount) * 100)}%` }}
                          />
                        </div>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Ingen feedback registrerad an.</p>
                )}
              </article>
            </div>

            <article className="history-analytics-card">
              <h3>Teknikprogress</h3>
              <div className="history-skill-progress-grid">
                {skillProgress.map((item) => (
                  <div key={`${item.typeLabel}-${item.skillName}`} className="history-skill-card">
                    <p className="history-skill-type">{item.typeLabel}</p>
                    <h4>{item.skillName}</h4>
                    <p>{item.sessions} pass</p>
                    <p>Senast: {formatDate(item.latestTimestamp)}</p>
                    <p>Feedback/pass: {(item.feedbackTotal / item.sessions).toFixed(1)}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>

          {typeOrder
            .filter((typeLabel) => groupedAnalyses[typeLabel] && Object.keys(groupedAnalyses[typeLabel]).length > 0)
            .map((typeLabel) => (
              <section key={typeLabel}>
                <h2 style={{ marginBottom: '12px' }}>🏐 {typeLabel}</h2>

                <div style={{ display: 'grid', gap: '20px' }}>
                  {Object.entries(groupedAnalyses[typeLabel])
                    .sort(([a], [b]) => a.localeCompare(b, 'sv'))
                    .map(([skillName, skillAnalyses]) => (
                      <div key={`${typeLabel}-${skillName}`}>
                        <h3 style={{ marginBottom: '10px', color: '#2c3e50' }}>Teknik: {skillName}</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                          {skillAnalyses.map((analysis) => (
                            <div
                              key={analysis.id}
                              onClick={() => setSelectedAnalysis(analysis)}
                              style={{
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                padding: '15px',
                                cursor: 'pointer',
                                transition: 'box-shadow 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'}
                              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                            >
                              <video
                                style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '4px' }}
                                preload="metadata"
                              >
                                <source src={analysis.videoUrl} type="video/mp4" />
                                <source src={analysis.videoUrl} type="video/webm" />
                              </video>

                              <h3 style={{ margin: '10px 0', fontSize: '1.1em' }}>{getAnalysisTitle(analysis)}</h3>

                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', color: '#666' }}>
                                <span>{analysis.feedback.length} tips</span>
                                <span>{analysis.nextSteps?.length ?? 0} nästa steg</span>
                              </div>

                              <p style={{ fontSize: '0.8em', color: '#999', marginTop: '5px' }}>
                                {formatDate(analysis.timestamp)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            ))}
        </div>
      )}

      {analysisToDelete && (
        <div className="confirm-dialog-overlay" role="dialog" aria-modal="true">
          <div className="confirm-dialog">
            <h3>Ta bort analys?</h3>
            <p>
              Du är på väg att ta bort <strong>{getAnalysisTitle(analysisToDelete)}</strong>. Detta går inte att ångra.
            </p>
            <div className="confirm-dialog-actions">
              <button type="button" onClick={() => setAnalysisToDelete(null)}>
                Avbryt
              </button>
              <button
                type="button"
                className="confirm-danger-btn"
                onClick={() => handleDeleteAnalysis(analysisToDelete.id)}
              >
                Ta bort
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default History