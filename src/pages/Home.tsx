import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import UploadButton from '../components/UploadButton.tsx'
import AppNav from '../components/AppNav.tsx'
import { skills } from '../utils/skills.ts'

interface HomeProps {
  onVideoSelect: (file: File | Blob, url: string) => void
}

function Home({ onVideoSelect }: HomeProps): JSX.Element {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const sportFromRoute = searchParams.get('sport')
  const initialSport: 'beachvolley' | 'volleyboll' =
    sportFromRoute === 'volleyboll' || sportFromRoute === 'beachvolley'
      ? sportFromRoute
      : 'beachvolley'

  const routeSkillName = searchParams.get('skill')
  const routeSkillType = searchParams.get('skillType')
  const initialSkill = skills.find(
    (skill) => skill.name === routeSkillName && skill.type === routeSkillType
  )

  const [sportFilter, setSportFilter] = useState<'beachvolley' | 'volleyboll'>(
    initialSkill?.type ?? initialSport
  )
  const [selectedSkillKey, setSelectedSkillKey] = useState<string>(
    initialSkill ? `${initialSkill.name}::${initialSkill.type}` : ''
  )

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('sport', sportFilter)

    if (selectedSkillKey) {
      const [name, type] = selectedSkillKey.split('::')
      params.set('skill', name)
      params.set('skillType', type)
    }

    const nextSearch = params.toString()
    const currentSearch = searchParams.toString()
    if (nextSearch !== currentSearch) {
      navigate({ pathname: '/', search: `?${nextSearch}` }, { replace: true })
    }
  }, [sportFilter, selectedSkillKey, searchParams, navigate])

  const filteredSkills = skills.filter(s => s.type === sportFilter)

  const handleVideoSelect = (file: File | Blob, url: string) => {
    if (selectedSkillKey) {
      const [name, type] = selectedSkillKey.split('::')
      const skill = skills.find(s => s.name === name && s.type === type)
      if (skill) {
        navigate('/analyze', { state: { skill, videoFile: file, videoUrl: url } })
        return
      }
    }
    onVideoSelect(file, url)
  }

  return (
    <div className="home">
      <AppNav />
      <header>
        <p className="home-hero-kicker">Din digitala tränarpartner</p>
        <h1 className="home-hero-title">Träna smartare. Spela vassare.</h1>
      </header>
      <main>
        <h2 className="home-hero-subtitle">
          Ladda upp eller spela in din teknik, analysera ruta för ruta och få tydlig feedback som lyfter nästa träning.
        </h2>

        <div className="home-skill-picker">
          <p className="home-skill-picker-label">Välj teknik att öva (valfritt)</p>

          <div className="home-sport-toggle">
            <button
              type="button"
              className={sportFilter === 'beachvolley' ? 'active' : ''}
              onClick={() => { setSportFilter('beachvolley'); setSelectedSkillKey('') }}
            >
              Beachvolley
            </button>
            <button
              type="button"
              className={sportFilter === 'volleyboll' ? 'active' : ''}
              onClick={() => { setSportFilter('volleyboll'); setSelectedSkillKey('') }}
            >
              Volleyboll
            </button>
          </div>

          <div className="home-skill-grid">
            {filteredSkills.map(skill => {
              const key = `${skill.name}::${skill.type}`
              return (
                <button
                  key={key}
                  type="button"
                  className={`home-skill-chip ${selectedSkillKey === key ? 'active' : ''}`}
                  onClick={() => setSelectedSkillKey(selectedSkillKey === key ? '' : key)}
                >
                  {skill.name}
                </button>
              )
            })}
          </div>
        </div>

        <UploadButton onVideoSelect={handleVideoSelect} />

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