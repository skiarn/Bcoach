import React from 'react'

interface IconProps {
  width?: number
  height?: number
  className?: string
}

// Playback Icons
export const PlayIcon: React.FC<IconProps> = ({ width = 24, height = 24, className = '' }) => (
  <svg viewBox="0 0 24 24" width={width} height={height} className={className} fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
)

export const PauseIcon: React.FC<IconProps> = ({ width = 24, height = 24, className = '' }) => (
  <svg viewBox="0 0 24 24" width={width} height={height} className={className} fill="currentColor">
    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
  </svg>
)

// Drawing Tools
export const LineIcon: React.FC<IconProps> = ({ width = 24, height = 24, className = '' }) => (
  <svg viewBox="0 0 24 24" width={width} height={height} className={className} stroke="currentColor" fill="none" strokeWidth={2}>
    <line x1="4" y1="20" x2="20" y2="4" />
  </svg>
)

export const CircleIcon: React.FC<IconProps> = ({ width = 24, height = 24, className = '' }) => (
  <svg viewBox="0 0 24 24" width={width} height={height} className={className} stroke="currentColor" fill="none" strokeWidth={2}>
    <circle cx="12" cy="12" r="8" />
  </svg>
)

export const RectangleIcon: React.FC<IconProps> = ({ width = 24, height = 24, className = '' }) => (
  <svg viewBox="0 0 24 24" width={width} height={height} className={className} stroke="currentColor" fill="none" strokeWidth={2}>
    <rect x="4" y="6" width="16" height="12" />
  </svg>
)

export const ArrowIcon: React.FC<IconProps> = ({ width = 24, height = 24, className = '' }) => (
  <svg viewBox="0 0 24 24" width={width} height={height} className={className} stroke="currentColor" fill="none" strokeWidth={2}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
)

export const EraserIcon: React.FC<IconProps> = ({ width = 24, height = 24, className = '' }) => (
  <svg viewBox="0 0 24 24" width={width} height={height} className={className} stroke="currentColor" fill="currentColor" strokeWidth={1.5}>
    <path d="M3 19L19 3h2L5 21H3z" />
    <path d="M15 9L9 15" stroke="currentColor" strokeWidth={2} fill="none" />
  </svg>
)

// Edit Actions
export const UndoIcon: React.FC<IconProps> = ({ width = 24, height = 24, className = '' }) => (
  <svg viewBox="0 0 24 24" width={width} height={height} className={className} stroke="currentColor" fill="none" strokeWidth={2}>
    <path d="M3 7v6h6M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
  </svg>
)

export const RedoIcon: React.FC<IconProps> = ({ width = 24, height = 24, className = '' }) => (
  <svg viewBox="0 0 24 24" width={width} height={height} className={className} stroke="currentColor" fill="none" strokeWidth={2}>
    <path d="M21 7V1h-6m0 16a9 9 0 019-9 9 9 0 016 2.3l3-2.3M3 13" />
  </svg>
)

export const TrashIcon: React.FC<IconProps> = ({ width = 24, height = 24, className = '' }) => (
  <svg viewBox="0 0 24 24" width={width} height={height} className={className} stroke="currentColor" fill="none" strokeWidth={2}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)

// Settings & Fullscreen
export const SettingsIcon: React.FC<IconProps> = ({ width = 24, height = 24, className = '' }) => (
  <svg viewBox="0 0 24 24" width={width} height={height} className={className} stroke="currentColor" fill="none" strokeWidth={2}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m3.08 3.08l4.24 4.24M1 12h6m6 0h6m-16.78 7.78l4.24-4.24m3.08-3.08l4.24-4.24M4.22 19.78l4.24-4.24m3.08-3.08l4.24-4.24" />
  </svg>
)

export const FullscreenIcon: React.FC<IconProps> = ({ width = 24, height = 24, className = '' }) => (
  <svg viewBox="0 0 24 24" width={width} height={height} className={className} stroke="currentColor" fill="none" strokeWidth={2}>
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
)

export const ExitFullscreenIcon: React.FC<IconProps> = ({ width = 24, height = 24, className = '' }) => (
  <svg viewBox="0 0 24 24" width={width} height={height} className={className} stroke="currentColor" fill="none" strokeWidth={2}>
    <path d="M8 3v5h5M3 8H8V3M16 3v5h-5m5 0h5V3m0 16v-5h-5m5 0h5v5m-5 0v-5" />
  </svg>
)

// Additional
export const ColorPickerIcon: React.FC<IconProps> = ({ width = 24, height = 24, className = '' }) => (
  <svg viewBox="0 0 24 24" width={width} height={height} className={className} fill="currentColor">
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="5" fill="white" />
  </svg>
)

export const ChevronDownIcon: React.FC<IconProps> = ({ width = 24, height = 24, className = '' }) => (
  <svg viewBox="0 0 24 24" width={width} height={height} className={className} stroke="currentColor" fill="none" strokeWidth={2}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

export const MenuIcon: React.FC<IconProps> = ({ width = 24, height = 24, className = '' }) => (
  <svg viewBox="0 0 24 24" width={width} height={height} className={className} stroke="currentColor" fill="none" strokeWidth={2}>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)
