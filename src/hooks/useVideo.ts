import { useState } from 'react'

interface VideoData {
  url: string;
  name: string;
}

function useVideo(): { video: VideoData | null; setVideo: (video: VideoData | null) => void } {
  const [video, setVideo] = useState<VideoData | null>(null)

  // logic here

  return { video, setVideo }
}

export default useVideo