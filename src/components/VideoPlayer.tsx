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
          className="video-player__video"
        />
      </div>
    )
  }
)

VideoPlayer.displayName = 'VideoPlayer'

export default VideoPlayer