import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import UploadButton from '../components/UploadButton.tsx'
import AppNav from '../components/AppNav.tsx'
import SkillPicker from '../components/SkillPicker.tsx'
import { findSkill, findSkillById, skills } from '../utils/skills.ts'
import { EmbeddedAnalysisMetadata } from '../types/analysis.ts'
import { extractMetadataFromVideo } from '../utils/videoMetadata.ts'
import { addImportedVideoFile } from '../services/videoLibrary.ts'
import { DEFAULT_SPORT_ID, normalizeSportId } from '../utils/sports.ts'

interface HomeProps {
  onVideoSelect: (file: File | Blob, url: string, metadata?: EmbeddedAnalysisMetadata, libraryId?: string) => void
}

function Home({ onVideoSelect }: HomeProps): JSX.Element {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isImportingMultiple, setIsImportingMultiple] = useState(false)
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const sportFromRoute = searchParams.get('sport')
  const initialSport = normalizeSportId(sportFromRoute) ?? DEFAULT_SPORT_ID

  const routeSkillName = searchParams.get('skill')
  const routeSkillId = searchParams.get('skillId')
  const routeSkillType = searchParams.get('skillType')
  const initialSkill = findSkillById(routeSkillId) ?? findSkill(routeSkillName, routeSkillType ?? initialSport)

  const [sportFilter, setSportFilter] = useState<string>(initialSkill?.sportId ?? initialSport)
  const [selectedSkillName, setSelectedSkillName] = useState<string>(initialSkill?.name ?? '')
  const [isHeroExpanded, setIsHeroExpanded] = useState<boolean>(!initialSkill?.name)

  const handleSkillTypeChange = (skillType: string) => {
    setSportFilter(skillType)
  }

  const handleSkillNameChange = (skillName: string) => {
    setSelectedSkillName(skillName)
    setIsHeroExpanded(!skillName)
  }

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('sport', sportFilter)

    if (selectedSkillName) {
      const selectedSkill = skills.find((entry) => entry.name === selectedSkillName && entry.sportId === sportFilter)
      params.set('skill', selectedSkillName)
      if (selectedSkill) {
        params.set('skillId', selectedSkill.id)
      }
      params.set('skillType', sportFilter)
    }

    const nextSearch = params.toString()
    const currentSearch = searchParams.toString()
    if (nextSearch !== currentSearch) {
      navigate({ pathname: '/', search: `?${nextSearch}` }, { replace: true })
    }
  }, [sportFilter, selectedSkillName, searchParams, navigate])

  const handleVideoSelect = (
    file: File | Blob,
    url: string,
    metadata?: EmbeddedAnalysisMetadata,
    libraryId?: string
  ) => {
    if (selectedSkillName) {
      const skill = skills.find(s => s.name === selectedSkillName && s.sportId === sportFilter)
      if (skill) {
        navigate('/analyze', {
          state: { skill, videoFile: file, videoUrl: url, embeddedMetadata: metadata, libraryId }
        })
        return
      }
    }
    onVideoSelect(file, url, metadata, libraryId)
  }

  const handleBatchImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.currentTarget.files ?? []).filter((file) =>
      file.type.startsWith('video/')
    )

    if (files.length === 0) {
      return
    }

    setImportError(null)
    setIsImportingMultiple(true)
    setImportProgress({ current: 0, total: files.length })

    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index]

        try {
          let metadata: EmbeddedAnalysisMetadata | undefined

          try {
            const extracted = await extractMetadataFromVideo(file, file.name)
            metadata = extracted?.metadata
          } catch {
            metadata = undefined
          }

          await addImportedVideoFile(file, metadata)
          setImportProgress({ current: index + 1, total: files.length })
        } catch (fileError) {
          console.error(`Error importing ${file.name}:`, fileError)
        }
      }

      alert(`Importerade ${files.length} video(s). Du kan se dem i historiken.`)
      setImportProgress(null)

      setTimeout(() => {
        navigate('/history')
      }, 500)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import failed'
      setImportError(message)
      console.error('Batch import error:', error)
    } finally {
      setIsImportingMultiple(false)
      setImportProgress(null)
      e.currentTarget.value = ''
    }
  }

  return (
    <div className="home">
      <AppNav />
      <header className={`home-hero ${isHeroExpanded ? 'expanded' : 'collapsed'}`}>
        <button
          type="button"
          onClick={() => setIsHeroExpanded(!isHeroExpanded)}
          className="home-hero-kicker-btn"
          title={isHeroExpanded ? 'Minimera' : 'Expandera'}
        >
          <p className="home-hero-kicker">{isHeroExpanded ? '▼' : '▶'} Din digitala tränarpartner</p>
        </button>
        <div className={`hero-content ${isHeroExpanded ? 'visible' : 'hidden'}`}>
          <h1 className="home-hero-title">Träna smartare. Spela vassare.</h1>
          <h2 className="home-hero-subtitle">
            Ladda upp eller spela in din teknik, analysera ruta för ruta och få tydlig feedback som lyfter nästa träning.
          </h2>
          <SkillPicker
            label="Välj teknik att öva (valfritt)"
            selectedSkillType={sportFilter}
            selectedSkillName={selectedSkillName}
            onSkillTypeChange={handleSkillTypeChange}
            onSkillNameChange={handleSkillNameChange}
            allowDeselect={true}
            className="home-hero-skill-picker"
          />
        </div>
      </header>
      <main>
        <UploadButton onVideoSelect={handleVideoSelect} />

        <div style={{ marginTop: '30px', padding: '20px', border: '2px dashed #0078d4', borderRadius: '8px', backgroundColor: '#f5f5f5' }}>
          <h3>Importera flera videor</h3>
          <p>Välj flera videofiler på en gång för att snabbt importera dem till biblioteket.</p>
          <input
            type="file"
            accept="video/*"
            multiple
            onChange={(e) => void handleBatchImport(e)}
            disabled={isImportingMultiple}
            style={{ display: 'none' }}
            id="batch-upload"
          />
          <label
            htmlFor="batch-upload"
            style={{
              display: 'inline-block',
              padding: '10px 16px',
              backgroundColor: isImportingMultiple ? '#ccc' : '#0078d4',
              color: 'white',
              borderRadius: '4px',
              cursor: isImportingMultiple ? 'not-allowed' : 'pointer',
              textDecoration: 'none',
              fontWeight: 'bold',
            }}
          >
            {isImportingMultiple ? 'Importerar...' : 'Välj videor'}
          </label>

          {importProgress && (
            <div style={{ marginTop: '10px' }}>
              <p>
                Importerar: {importProgress.current} / {importProgress.total}
              </p>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#ddd', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${(importProgress.current / importProgress.total) * 100}%`,
                    height: '100%',
                    backgroundColor: '#0078d4',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          )}

          {importError && (
            <p style={{ marginTop: '10px', color: '#d13438' }}>
              Fel under import: {importError}
            </p>
          )}
        </div>
      </main>
    </div>
  )
}

export default Home