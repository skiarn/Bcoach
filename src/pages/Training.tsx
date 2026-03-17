import { useState } from 'react'
import { Link } from 'react-router-dom'
import { skills } from '../utils/skills.ts'

function Training(): JSX.Element {
  const [filterType, setFilterType] = useState<'all' | 'beachvolley' | 'volleyboll'>('beachvolley')

  const filteredSkills = skills.filter(skill => filterType === 'all' || skill.type === filterType)

  return (
    <div className="training">
      <header>
        <h1>🏐 Träning - Volleyboll Tekniker</h1>
        <nav className="nav-links">
          <Link to="/">Hem</Link>
          <Link to="/history">Mina videos</Link>
        </nav>
      </header>
      <main>
        <h2>Välj en teknik att öva på</h2>
        <div style={{ marginBottom: '20px' }}>
          <label>
            <input
              type="radio"
              value="beachvolley"
              checked={filterType === 'beachvolley'}
              onChange={() => setFilterType('beachvolley')}
            />
            Beachvolley
          </label>
          <label style={{ marginLeft: '20px' }}>
            <input
              type="radio"
              value="volleyboll"
              checked={filterType === 'volleyboll'}
              onChange={() => setFilterType('volleyboll')}
            />
            Volleyboll
          </label>
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
            <div key={`${skill.name}-${skill.type}`} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
              <h3>{skill.name}</h3>
              <p>({skill.type})</p>
              <Link to={`/practice/${encodeURIComponent(skill.name)}/${skill.type}`} style={{ display: 'inline-block', marginTop: '10px', padding: '8px 16px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
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