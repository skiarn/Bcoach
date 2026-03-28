import { useParams, Link, useNavigate } from 'react-router-dom'
import { findSkill, findSkillById } from '../utils/skills.ts'
import UploadButton from '../components/UploadButton.tsx'
import { EmbeddedAnalysisMetadata } from '../types/analysis.ts'
import { getSportLabel, normalizeSportId } from '../utils/sports.ts'

function SkillPractice(): JSX.Element {
  const { paramA, paramB } = useParams<{ paramA: string; paramB: string }>()
  const navigate = useNavigate()

  const firstSegment = decodeURIComponent(paramA || '')
  const secondSegment = decodeURIComponent(paramB || '')
  const maybeSportId = normalizeSportId(firstSegment)
  const skill = maybeSportId
    ? findSkillById(secondSegment)
    : findSkill(firstSegment, secondSegment)

  if (!skill) {
    return <div>Skill not found</div>
  }

  const handleVideoSelect = (
    file: File | Blob,
    url: string,
    metadata?: EmbeddedAnalysisMetadata,
    libraryId?: string
  ) => {
    navigate('/analyze', {
      state: { skill, videoFile: file, videoUrl: url, embeddedMetadata: metadata, libraryId }
    })
  }

  return (
    <div className="skill-practice">
      <header>
        <h1>🏐 Öva {skill.name} ({getSportLabel(skill.sportId)})</h1>
        <nav className="nav-links">
          <Link to="/training">Tillbaka till träning</Link>
          <Link to="/history">Mina videos</Link>
        </nav>
      </header>
      <main>
        <h2>Instruktionsvideor</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {skill.videoUrls.map((url, index) => (
            <a key={index} href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff' }}>
              Video {index + 1}
            </a>
          ))}
        </div>
        <h2>Råd för att göra ett rent {skill.name.toLowerCase()}</h2>
        <ul>
          {skill.advice.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
        <h2>Öva nu</h2>
        <p>Spela in eller ladda upp en video av ditt försök, så får du feedback.</p>
        <UploadButton onVideoSelect={handleVideoSelect} />
      </main>
    </div>
  )
}

export default SkillPractice