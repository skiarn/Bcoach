import { useParams, useNavigate } from 'react-router-dom'
import { findSkill, findSkillById } from '../utils/skills.ts'
import UploadButton from '../components/UploadButton.tsx'
import AppNav from '../components/AppNav.tsx'
import { EmbeddedAnalysisMetadata } from '../types/analysis.ts'
import { getSportLabel, normalizeSportId } from '../utils/sports.ts'
import { useI18n } from '../i18n/I18nProvider.tsx'

function SkillPractice(): JSX.Element {
  const { t, locale } = useI18n()
  const { paramA, paramB } = useParams<{ paramA: string; paramB: string }>()
  const navigate = useNavigate()

  const firstSegment = decodeURIComponent(paramA || '')
  const secondSegment = decodeURIComponent(paramB || '')
  const maybeSportId = normalizeSportId(firstSegment)
  const skill = maybeSportId
    ? findSkillById(secondSegment, locale)
    : findSkill(firstSegment, secondSegment, locale)

  if (!skill) {
    return <div>{t('practice.notFound')}</div>
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
      <AppNav />
      <header>
        <h1>🏐 {t('practice.title', { skill: skill.name, sport: getSportLabel(skill.sportId, locale) })}</h1>
      </header>
      <main>
        <h2>{t('practice.instructionVideos')}</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {skill.videoUrls.map((url, index) => (
            <a key={index} href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff' }}>
              {t('practice.videoN', { index: index + 1 })}
            </a>
          ))}
        </div>
        <h2>{t('practice.adviceTitle', { skill: skill.name.toLowerCase() })}</h2>
        <ul>
          {skill.advice.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
        <h2>{t('practice.startNow')}</h2>
        <p>{t('practice.startNowBody')}</p>
        <UploadButton onVideoSelect={handleVideoSelect} />
      </main>
    </div>
  )
}

export default SkillPractice