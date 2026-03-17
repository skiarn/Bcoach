import { Link } from 'react-router-dom'
import { useState } from 'react'
import useLocalStorage from '../hooks/useLocalStorage.ts'

interface VideoAnalysis {
  id: string
  videoUrl: string
  videoName: string
  shapes: any[]
  feedback: string[]
  timestamp: number
}

function History(): JSX.Element {
  const [analyses] = useLocalStorage<VideoAnalysis[]>('beach-volley-analyses', [])
  const [selectedAnalysis, setSelectedAnalysis] = useState<VideoAnalysis | null>(null)

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (selectedAnalysis) {
    return (
      <div className="analysis-detail">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={() => setSelectedAnalysis(null)}>← Tillbaka</button>
          <h1>{selectedAnalysis.videoName}</h1>
          <div></div>
        </header>

        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <video controls style={{ width: '100%', maxWidth: '640px' }}>
              <source src={selectedAnalysis.videoUrl} type="video/mp4" />
              <source src={selectedAnalysis.videoUrl} type="video/webm" />
            </video>
          </div>

          <div style={{ width: '300px' }}>
            <h3>Feedback ({selectedAnalysis.feedback.length} tips)</h3>
            <ul>
              {selectedAnalysis.feedback.map((tip, index) => (
                <li key={index} style={{ marginBottom: '10px' }}>{tip}</li>
              ))}
            </ul>

            <h3>Ritningar ({selectedAnalysis.shapes.length} former)</h3>
            <p>Former: {selectedAnalysis.shapes.map(shape => shape.type).join(', ')}</p>

            <p style={{ fontSize: '0.9em', color: '#666', marginTop: '20px' }}>
              Analyserad: {formatDate(selectedAnalysis.timestamp)}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="history">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#007bff' }}>← Tillbaka</Link>
        <h1>Mina videos</h1>
        <div></div>
      </header>

      {analyses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h2>Inga analyser än</h2>
          <p>Gör din första videoanalys för att komma igång!</p>
          <Link to="/" style={{ color: '#007bff', textDecoration: 'none' }}>
            Gå till startsidan →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {analyses.map((analysis) => (
            <div
              key={analysis.id}
              onClick={() => setSelectedAnalysis(analysis)}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <video
                style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '4px' }}
                preload="metadata"
              >
                <source src={analysis.videoUrl} type="video/mp4" />
                <source src={analysis.videoUrl} type="video/webm" />
              </video>

              <h3 style={{ margin: '10px 0', fontSize: '1.1em' }}>{analysis.videoName}</h3>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', color: '#666' }}>
                <span>{analysis.feedback.length} tips</span>
                <span>{analysis.shapes.length} ritningar</span>
              </div>

              <p style={{ fontSize: '0.8em', color: '#999', marginTop: '5px' }}>
                {formatDate(analysis.timestamp)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default History