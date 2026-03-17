interface ControlsProps {
  isPlaying: boolean
  playbackRate: number
  currentTime: number
  duration: number
  onPlay: () => void
  onPause: () => void
  onSpeedChange: (speed: number) => void
  onSeek: (time: number) => void
  onToggleDrawing: () => void
  showDrawingCanvas: boolean
  videoLoaded: boolean
}

function Controls({
  isPlaying,
  playbackRate,
  currentTime,
  duration,
  onPlay,
  onPause,
  onSpeedChange,
  onSeek,
  onToggleDrawing,
  showDrawingCanvas,
  videoLoaded
}: ControlsProps): JSX.Element {
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="controls" style={{ marginTop: '10px' }}>
      {/* Playback Controls */}
      <div style={{ marginBottom: '10px' }}>
        <button onClick={isPlaying ? onPause : onPlay}>
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <span style={{ margin: '0 10px' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '10px' }}>
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={(e) => onSeek(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* Speed Controls */}
      <div style={{ marginBottom: '10px' }}>
        <button onClick={() => onSpeedChange(0.5)} style={{ opacity: playbackRate === 0.5 ? 1 : 0.5 }}>
          0.5x
        </button>
        <button onClick={() => onSpeedChange(1)} style={{ opacity: playbackRate === 1 ? 1 : 0.5 }}>
          1x
        </button>
        <button onClick={() => onSpeedChange(1.5)} style={{ opacity: playbackRate === 1.5 ? 1 : 0.5 }}>
          1.5x
        </button>
        <button onClick={() => onSpeedChange(2)} style={{ opacity: playbackRate === 2 ? 1 : 0.5 }}>
          2x
        </button>
      </div>

      {/* Drawing Toggle */}
      {videoLoaded && (
        <div>
          <button onClick={onToggleDrawing}>
            {showDrawingCanvas ? '🔴 Stäng ritverktyg' : '✏️ Öppna ritverktyg'}
          </button>
        </div>
      )}
    </div>
  )
}

export default Controls