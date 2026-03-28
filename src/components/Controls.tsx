interface ControlsProps {
  isPlaying: boolean
  playbackRate: number
  currentTime: number
  duration: number
  onPlay: () => void
  onPause: () => void
  onSpeedChange: (speed: number) => void
  onSeek: (time: number) => void
  videoLoaded: boolean
  onToggleDrawing?: () => void
  showDrawingCanvas?: boolean
  onToggleFullscreen?: () => void
  isFullscreen?: boolean
}

import { useI18n } from '../i18n/I18nProvider.tsx'

function Controls({
  isPlaying,
  playbackRate,
  currentTime,
  duration,
  onPlay,
  onPause,
  onSpeedChange,
  onSeek,
  videoLoaded,
  onToggleDrawing,
  showDrawingCanvas,
  onToggleFullscreen,
  isFullscreen = false,
}: ControlsProps): JSX.Element {
  const { t } = useI18n()
  const sliderMax = Math.max(duration, currentTime, 0.1)

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="controls">
      {/* Row 1: play + time + fullscreen */}
      <div className="controls-row controls-row--top">
        <button className="controls-btn controls-btn--play" onClick={isPlaying ? onPause : onPlay}>
          {isPlaying ? '⏸' : '▶'}
        </button>

        <span className="controls-time">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <div className="controls-right-actions">
          {onToggleDrawing && (
            <button className="controls-btn" onClick={onToggleDrawing}>
              {showDrawingCanvas ? `✏️ ${t('controls.closeDrawing')}` : `✏️ ${t('controls.openDrawing')}`}
            </button>
          )}
          {onToggleFullscreen && videoLoaded && (
            <button className="controls-btn controls-btn--fullscreen" onClick={onToggleFullscreen} title={isFullscreen ? t('controls.exitFullscreen') : t('controls.fullscreen')}>
              {isFullscreen ? (
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Row 2: seek bar */}
      <div className="controls-row">
        <input
          className="controls-seek"
          type="range"
          min="0"
          max={sliderMax}
          step={0.1}
          value={currentTime}
          onChange={(e) => onSeek(Number(e.target.value))}
        />
      </div>

      {/* Row 3: speed controls */}
      <div className="controls-row">
        {([0.5, 1, 1.5, 2] as const).map((speed) => (
          <button
            key={speed}
            className={`controls-btn controls-btn--speed ${playbackRate === speed ? 'active' : ''}`}
            onClick={() => onSpeedChange(speed)}
          >
            {speed}{t('common.speedSuffix')}
          </button>
        ))}
      </div>
    </div>
  )
}

export default Controls