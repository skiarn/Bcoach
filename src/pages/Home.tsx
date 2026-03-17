
import { Link } from 'react-router-dom'
import UploadButton from '../components/UploadButton.tsx'

interface HomeProps {
  onVideoSelect: (file: File | Blob, url: string) => void
}

function Home({ onVideoSelect }: HomeProps): JSX.Element {
  return (
    <div className="home">
      <header>
        <h1>🏐 Beach Volley Analyzer</h1>
        <nav className="nav-links">
          <Link to="/training">Träning</Link>
          <Link to="/history">Mina videos</Link>
        </nav>
      </header>
      <main>
        <h2>Bli bättre på beachvolley – analysera dina videos och få feedback direkt</h2>
        <UploadButton onVideoSelect={onVideoSelect} />
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p>eller</p>
          <Link to="/history" style={{ color: '#007bff', textDecoration: 'none' }}>
            Se tidigare analyser →
          </Link>
        </div>
      </main>
    </div>
  )
}

export default Home