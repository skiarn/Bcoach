import { useState } from 'react'
import { Link } from 'react-router-dom'
import AppNav from '../components/AppNav.tsx'
import { skills } from '../utils/skills.ts'
import { getEnabledSports, getSportLabel } from '../utils/sports.ts'

function Training(): JSX.Element {
  const availableSports = getEnabledSports()
  const initialFilter = availableSports[0]?.id ?? 'all'
  const [filterType, setFilterType] = useState<string | 'all'>(initialFilter)

  const filteredSkills = skills.filter(skill => filterType === 'all' || skill.sportId === filterType)

  return (
    <div className="training">
      <AppNav />
      <header>
        <h1>🏐 Träning</h1>
      </header>
      <main>
        <h2>Välj en teknik att öva på</h2>
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
            Alla
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          {filteredSkills.map(skill => (
            <div key={skill.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
              <h3>{skill.name}</h3>
              <p>({getSportLabel(skill.sportId)})</p>
              <Link to={`/practice/${encodeURIComponent(skill.sportId)}/${encodeURIComponent(skill.id)}`} style={{ display: 'inline-block', marginTop: '10px', padding: '8px 16px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
                Öva denna teknik
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default Training