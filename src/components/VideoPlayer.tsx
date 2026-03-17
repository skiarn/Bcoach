import { forwardRef } from 'react'

interface VideoPlayerProps {
  src: string
  onTimeUpdate?: () => void
  onLoadedMetadata?: () => void
}

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ src, onTimeUpdate, onLoadedMetadata }, ref) => {
    return (
      <div className="video-player">
        <video
          ref={ref}
          controls={false}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          style={{ width: '100%', maxWidth: '640px' }}
        >
          <source src={src} type="video/mp4" />
          <source src={src} type="video/webm" />
          Your browser does not support the video tag.
        </video>
      </div>
    )
  }
)

VideoPlayer.displayName = 'VideoPlayer'

export default VideoPlayer