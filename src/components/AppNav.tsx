import { NavLink, useLocation } from 'react-router-dom'
import { getCurrentLocale, setCurrentLocale } from '../utils/locale.ts'

const NAV_LABELS: Record<string, { home: string; training: string; history: string; navAria: string; language: string }> = {
  sv: {
    home: 'Hem',
    training: 'Träning',
    history: 'Mina videos',
    navAria: 'Huvudnavigering',
    language: 'Språk',
  },
  en: {
    home: 'Home',
    training: 'Training',
    history: 'My Videos',
    navAria: 'Main navigation',
    language: 'Language',
  },
}

function AppNav(): JSX.Element {
  const location = useLocation()
  const locale = getCurrentLocale()
  const labels = NAV_LABELS[locale] ?? NAV_LABELS.sv

  const handleLanguageChange = (nextLocale: string) => {
    const normalized = setCurrentLocale(nextLocale)
    const params = new URLSearchParams(location.search)
    params.set('lang', normalized)

    // Use window.location.href to ensure the URL changes before reload
    // import.meta.env.BASE_URL includes the base path (e.g., '/Bcoach/' in production)
    const basePath = import.meta.env.BASE_URL
    const pathname = location.pathname.startsWith(basePath)
      ? location.pathname.slice(basePath.length)
      : location.pathname
    window.location.href = `${basePath}${pathname}?${params.toString()}`
  }

  return (
    <nav className="app-top-nav" aria-label={labels.navAria}>
      <div className="app-top-nav__brand">🏐 Bcoach</div>
      <div className="app-top-nav__right">
        <div className="app-top-nav__links">
          <NavLink to="/" end className={({ isActive }) => `app-top-nav__link ${isActive ? 'active' : ''}`}>
            {labels.home}
          </NavLink>
          <NavLink to="/training" className={({ isActive }) => `app-top-nav__link ${isActive ? 'active' : ''}`}>
            {labels.training}
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `app-top-nav__link ${isActive ? 'active' : ''}`}>
            {labels.history}
          </NavLink>
        </div>

        <div className="app-top-nav__lang" role="group" aria-label={labels.language}>
          <button
            type="button"
            className={locale === 'sv' ? 'active' : ''}
            onClick={() => handleLanguageChange('sv')}
          >
            SV
          </button>
          <button
            type="button"
            className={locale === 'en' ? 'active' : ''}
            onClick={() => handleLanguageChange('en')}
          >
            EN
          </button>
        </div>
      </div>
    </nav>
  )
}

export default AppNav
