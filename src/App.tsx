import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.tsx'
import Analyze from './pages/Analyze.tsx'
import History from './pages/History.tsx'
import Training from './pages/Training.tsx'
import SkillPractice from './pages/SkillPractice.tsx'
import VideoEditor from './pages/VideoEditor.tsx'
import { EmbeddedAnalysisMetadata } from './types/analysis.ts'

function App(): JSX.Element {
  const [selectedVideo, setSelectedVideo] = useState<{
    file: File | Blob
    url: string
    metadata?: EmbeddedAnalysisMetadata
    libraryId?: string
  } | null>(null)

  useEffect(() => {
    const { pathname, search, hash } = window.location
    if (pathname === '/Bcoach') {
      window.history.replaceState(window.history.state, '', `/Bcoach/${search}${hash}`)
    }
  }, [])

  const handleVideoSelect = (
    file: File | Blob,
    url: string,
    metadata?: EmbeddedAnalysisMetadata,
    libraryId?: string
  ) => {
    setSelectedVideo({ file, url, metadata, libraryId })
  }

  const handleBackToHome = () => {
    setSelectedVideo(null)
  }

  return (
    <Router basename="/Bcoach">
      <div className="App">
        <Routes>
          <Route
            path="/"
            element={
              selectedVideo ? (
                <Analyze
                  videoUrl={selectedVideo.url}
                  videoFile={selectedVideo.file}
                  libraryId={selectedVideo.libraryId}
                  embeddedMetadata={selectedVideo.metadata}
                  onBack={handleBackToHome}
                  onNavigateHome={handleBackToHome}
                />
              ) : (
                <Home onVideoSelect={handleVideoSelect} />
              )
            }
          />
          <Route path="/analyze" element={<Analyze onBack={() => window.history.back()} />} />
          <Route path="/history" element={<History />} />
          <Route path="/edit/:videoId" element={<VideoEditor />} />
          <Route path="/training" element={<Training />} />
          <Route path="/practice/:paramA/:paramB" element={<SkillPractice />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App