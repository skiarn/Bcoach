import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.tsx'
import Analyze from './pages/Analyze.tsx'
import History from './pages/History.tsx'
import Training from './pages/Training.tsx'
import SkillPractice from './pages/SkillPractice.tsx'

function App(): JSX.Element {
  const [selectedVideo, setSelectedVideo] = useState<{ file: File | Blob; url: string } | null>(null)

  const handleVideoSelect = (file: File | Blob, url: string) => {
    setSelectedVideo({ file, url })
  }

  const handleBackToHome = () => {
    setSelectedVideo(null)
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
            path="/"
            element={
              selectedVideo ? (
                <Analyze
                  videoUrl={selectedVideo.url}
                  videoFile={selectedVideo.file}
                  onBack={handleBackToHome}
                />
              ) : (
                <Home onVideoSelect={handleVideoSelect} />
              )
            }
          />
          <Route path="/analyze" element={<Analyze onBack={() => window.history.back()} />} />
          <Route path="/history" element={<History />} />
          <Route path="/training" element={<Training />} />
          <Route path="/practice/:skillName/:type" element={<SkillPractice />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App