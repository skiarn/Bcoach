import React, { useEffect, useState } from 'react'
import { useDeviceType } from '../hooks/useDeviceType'
import ResponsiveToolbar, { type ToolbarGroup } from './ui/ResponsiveToolbar'
import * as Icons from './ui/Icons'
import { useI18n } from '../i18n/I18nProvider'

interface PlaybackToolbarProps {
  isPlaying: boolean
  currentTime: number
  duration: number
  onPlay: () => void
  onPause: () => void
  onSeek: (time: number) => void
  videoLoaded: boolean
  onToggleDrawing?: () => void
  showDrawingCanvas?: boolean
  onToggleFullscreen?: () => void
  isFullscreen?: boolean
}

function formatTime(time: number): string {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Modern playback toolbar with responsive design
 * Adapts from desktop (horizontal, full controls) to mobile (tab-based, simplified)
 */
export const PlaybackToolbar: React.FC<PlaybackToolbarProps> = ({
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  onSeek,
  videoLoaded,
  onToggleDrawing,
  showDrawingCanvas,
  onToggleFullscreen,
  isFullscreen = false,
}) => {
  const { t } = useI18n()
  const deviceType = useDeviceType()
  const [seekTime, setSeekTime] = useState(currentTime)

  useEffect(() => {
    setSeekTime(currentTime)
  }, [currentTime])

  const isDesktop = deviceType === 'desktop'
  const isMobile = deviceType === 'mobile'

  const sliderMax = Math.max(duration, currentTime, 0.1)

  // Build toolbar groups based on device type
  const buildToolbarGroups = (): ToolbarGroup[] => {
    const playbackGroup: ToolbarGroup = {
      id: 'playback',
      label: t('controls.playback') || 'Playback',
      items: [
        {
          id: 'play-pause',
          icon: isPlaying ? <Icons.PauseIcon /> : <Icons.PlayIcon />,
          label: isPlaying ? t('controls.pause') || 'Pause' : t('controls.play') || 'Play',
          onClick: isPlaying ? onPause : onPlay,
          variant: 'primary',
        },
      ],
    }

    const toolsGroup: ToolbarGroup | null = (onToggleDrawing || onToggleFullscreen)
      ? {
          id: 'tools',
          label: t('controls.tools') || 'Tools',
          items: [
            ...(onToggleDrawing
              ? [
                  {
                    id: 'drawing',
                    icon: <Icons.LineIcon />,
                    label: showDrawingCanvas
                      ? t('controls.closeDrawing') || 'Close Drawing'
                      : t('controls.openDrawing') || 'Open Drawing',
                    onClick: onToggleDrawing,
                    active: showDrawingCanvas,
                  },
                ]
              : []),
            ...(onToggleFullscreen
              ? [
                  {
                    id: 'fullscreen',
                    icon: isFullscreen ? <Icons.ExitFullscreenIcon /> : <Icons.FullscreenIcon />,
                    label: isFullscreen ? t('controls.exitFullscreen') || 'Exit Fullscreen' : t('controls.fullscreen') || 'Fullscreen',
                    onClick: onToggleFullscreen,
                  },
                ]
              : []),
          ],
        }
      : null

    if (isDesktop) {
      return [playbackGroup, ...(toolsGroup ? [toolsGroup] : [])]
    }

    if (isMobile) {
      return [playbackGroup, ...(toolsGroup ? [toolsGroup] : [])]
    }

    // Tablet: same as desktop
    return [playbackGroup, ...(toolsGroup ? [toolsGroup] : [])]
  }

  // Mobile layout: stacked with time display
  if (isMobile) {
    return (
      <div className="playback-toolbar playback-toolbar--mobile">
        {/* Time display and seek bar */}
        <div className="playback-toolbar__seek-section">
          <div className="playback-toolbar__time">
            <span className="playback-toolbar__current-time">{formatTime(seekTime)}</span>
            <span className="playback-toolbar__duration">{formatTime(duration)}</span>
          </div>
          <input
            className="playback-toolbar__seek-slider"
            type="range"
            min="0"
            max={sliderMax}
            step={0.1}
            value={seekTime}
            onChange={(e) => {
              const time = Number(e.target.value)
              setSeekTime(time)
            }}
            onMouseUp={(e) => onSeek(Number(e.currentTarget.value))}
            onTouchEnd={(e) => onSeek(Number(e.currentTarget.value))}
            disabled={!videoLoaded}
          />
        </div>

        {/* Tab-based toolbar */}
        <ResponsiveToolbar groups={buildToolbarGroups()} />
      </div>
    )
  }

  // Desktop/Tablet layout: horizontal with integrated seek bar
  return (
    <div className="playback-toolbar playback-toolbar--desktop">
      {/* Main toolbar */}
      <ResponsiveToolbar groups={buildToolbarGroups()} alignment="start" />

      {/* Seek bar section */}
      <div className="playback-toolbar__seek-section-inline">
        <input
          className="playback-toolbar__seek-slider-inline"
          type="range"
          min="0"
          max={sliderMax}
          step={0.1}
          value={seekTime}
          onChange={(e) => {
            const time = Number(e.target.value)
            setSeekTime(time)
          }}
          onMouseUp={(e) => onSeek(Number(e.currentTarget.value))}
          onTouchEnd={(e) => onSeek(Number(e.currentTarget.value))}
          disabled={!videoLoaded}
        />

        <div className="playback-toolbar__time-inline">
          <span>{formatTime(seekTime)}</span>
          <span className="playback-toolbar__separator">|</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  )
}

export default PlaybackToolbar
