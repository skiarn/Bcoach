import { useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import VideoPlayer from '../components/VideoPlayer.tsx'
import DrawingCanvas from '../components/DrawingCanvas.tsx'
import Controls from '../components/Controls.tsx'
import FeedbackPanel from '../components/FeedbackPanel.tsx'
import useLocalStorage from '../hooks/useLocalStorage.ts'
import { Skill } from '../utils/skills.ts'

interface VideoAnalysis {
  id: string
  videoUrl: string
  videoName: string
  shapes: any[]
  feedback: string[]
  timestamp: number
}

interface AnalyzeProps {
  videoUrl?: string
  videoFile?: File | Blob
  onBack: () => void
}

type Tool = "line" | "circle" | "none";

interface Shape {
  type: "line" | "circle";
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

function Analyze({ videoUrl: propVideoUrl, videoFile: propVideoFile, onBack }: AnalyzeProps): JSX.Element {
  const location = useLocation()
  const skill: Skill | undefined = location.state?.skill
  const videoUrl = propVideoUrl || location.state?.videoUrl
  const videoFile = propVideoFile || location.state?.videoFile

  if (!videoUrl || !videoFile) {
    return (
      <div className="analyze">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={onBack}>← Tillbaka</button>
          <h1>Videoanalys</h1>
          <div></div>
        </header>
        <p>Ingen video vald. Välj en video först.</p>
      </div>
    )
  }
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [showDrawingCanvas, setShowDrawingCanvas] = useState(false)
  const [tool, setTool] = useState<Tool>("line");
  const [customFeedback, setCustomFeedback] = useState<string[]>([])

  const videoName = videoFile instanceof File ? videoFile.name : 'Inspelad video'

  // Video event handlers
  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
      setPlaybackRate(speed)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      setVideoLoaded(true)
    }
  }

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
    }
  }

  // Save analysis
  const handleSaveAnalysis = (shapes: any[]) => {
    const feedback = customFeedback.length > 0 ? customFeedback : (skill ? skill.advice : [
      "Du hoppar lite sent",
      "Armen är inte helt rak",
      "Försök att följa igenom slaget mer"
    ])

    const newAnalysis: VideoAnalysis = {
      id: Date.now().toString(),
      videoUrl,
      videoName,
      shapes,
      feedback,
      timestamp: Date.now()
    }

    setAnalyses([newAnalysis, ...analyses])
    alert('Analys sparad! Du kan se den under "Mina videos"')
  }

  const clearCanvas = () => {
    setShapes([]);
  };

  const undoLastShape = () => {
    setShapes((prev) => prev.slice(0, -1));
  };

  const saveAnalysis = () => {
    handleSaveAnalysis(shapes);
  };

  return (
    <div className="analyze">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={onBack}>← Tillbaka</button>
        <h1>Videoanalys: {videoName}</h1>
        <div></div>
      </header>

      <div style={{ position: 'relative', display: 'flex', gap: '20px' }}>
        {/* Video Section */}
        <div style={{ flex: 1, position: 'relative' }}>
          <VideoPlayer
            ref={videoRef}
            src={videoUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
          />

          {showDrawingCanvas && videoLoaded && videoRef.current && videoRef.current.offsetWidth > 0 && videoRef.current.offsetHeight > 0 && (
            <div style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              zIndex: 10
            }}>
              <DrawingCanvas
                width={videoRef.current.offsetWidth}
                height={videoRef.current.offsetHeight}
                tool={tool}
                shapes={shapes}
                onShapesChange={setShapes}
              />
            </div>
          )}

          <Controls
            isPlaying={isPlaying}
            playbackRate={playbackRate}
            currentTime={currentTime}
            duration={duration}
            onPlay={handlePlay}
            onPause={handlePause}
            onSpeedChange={handleSpeedChange}
            onSeek={handleSeek}
            onToggleDrawing={() => setShowDrawingCanvas(!showDrawingCanvas)}
            showDrawingCanvas={showDrawingCanvas}
            videoLoaded={videoLoaded}
          />

          {showDrawingCanvas && (
            <div className="drawing-tools">
              <button onClick={() => setTool("line")}>Line</button>
              <button onClick={() => setTool("circle")}>Circle</button>
              <button onClick={() => setTool("none")}>None</button>
              <button onClick={undoLastShape}>Undo</button>
              <button onClick={clearCanvas}>Clear</button>
              <button onClick={saveAnalysis} className="save-button">
                💾 Spara analys
              </button>
            </div>
          )}
        </div>

        {/* Feedback Section */}
        <div style={{ width: '300px' }}>
          <FeedbackPanel skill={skill} onFeedbackChange={setCustomFeedback} />
        </div>
      </div>
    </div>
  )
}

export default Analyze