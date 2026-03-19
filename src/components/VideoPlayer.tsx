import { forwardRef } from 'react'

interface VideoPlayerProps {
  src: string
  onTimeUpdate?: () => void
  onLoadedMetadata?: () => void
  isFullscreen?: boolean
}

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ src, onTimeUpdate, onLoadedMetadata }, ref) => {
    return (
      <div className="video-player">
        <video
          ref={ref}
          src={src}
          controls={false}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </div>
    )
  }
)

VideoPlayer.displayName = 'VideoPlayer'

export default VideoPlayer