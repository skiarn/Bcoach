import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import UploadButton from '../components/UploadButton.tsx'
import AppNav from '../components/AppNav.tsx'
import SkillPicker from '../components/SkillPicker.tsx'
import { skills } from '../utils/skills.ts'
import { EmbeddedAnalysisMetadata } from '../types/analysis.ts'
import { extractMetadataFromVideo } from '../utils/videoMetadata.ts'
import { addImportedVideoFile } from '../services/videoLibrary.ts'

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
  const [selectedSkillName, setSelectedSkillName] = useState<string>(initialSkill?.name ?? '')

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('sport', sportFilter)

    if (selectedSkillName) {
      params.set('skill', selectedSkillName)
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
      const skill = skills.find(s => s.name === selectedSkillName && s.type === sportFilter)
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
      <header>
        <p className="home-hero-kicker">Din digitala tränarpartner</p>
        <h1 className="home-hero-title">Träna smartare. Spela vassare.</h1>
      </header>
      <main>
        <h2 className="home-hero-subtitle">
          Ladda upp eller spela in din teknik, analysera ruta för ruta och få tydlig feedback som lyfter nästa träning.
        </h2>

        <SkillPicker
          label="Välj teknik att öva (valfritt)"
          selectedSkillType={sportFilter}
          selectedSkillName={selectedSkillName}
          onSkillTypeChange={setSportFilter}
          onSkillNameChange={setSelectedSkillName}
          allowDeselect={true}
        />

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