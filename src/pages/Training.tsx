import { useState } from 'react'
import { Link } from 'react-router-dom'
import AppNav from '../components/AppNav.tsx'
import { getSkills } from '../utils/skills.ts'
import { getEnabledSports, getSportLabel } from '../utils/sports.ts'
import { useI18n } from '../i18n/I18nProvider.tsx'

function Training(): JSX.Element {
  const { t, locale } = useI18n()
  const availableSports = getEnabledSports(locale)
  const skills = getSkills(locale)
  const initialFilter = availableSports[0]?.id ?? 'all'
  const [filterType, setFilterType] = useState<string | 'all'>(initialFilter)

  const filteredSkills = skills.filter(skill => filterType === 'all' || skill.sportId === filterType)

  return (
    <div className="training">
      <AppNav />
      <header>
        <h1>🏐 {t('training.title')}</h1>
      </header>
      <main>
        <h2>{t('training.chooseSkill')}</h2>
        <div style={{ marginBottom: '20px' }}>
          {availableSports.map((sport, index) => (
            <label key={sport.id} style={index > 0 ? { marginLeft: '20px' } : undefined}>
              <input
                type="radio"
                value={sport.id}
                checked={filterType === sport.id}
                onChange={() => setFilterType(sport.id)}
              />
              {sport.label}
            </label>
          ))}
          <label style={{ marginLeft: '20px' }}>
            <input
              type="radio"
              value="all"
              checked={filterType === 'all'}
              onChange={() => setFilterType('all')}
            />
            {t('training.all')}
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          {filteredSkills.map(skill => (
            <div key={skill.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
              <h3>{skill.name}</h3>
              <p>({getSportLabel(skill.sportId, locale)})</p>
              <Link to={`/practice/${encodeURIComponent(skill.sportId)}/${encodeURIComponent(skill.id)}`} style={{ display: 'inline-block', marginTop: '10px', padding: '8px 16px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
                {t('training.practiceSkill')}
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default Training