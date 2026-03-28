import { NavLink, useLocation } from 'react-router-dom'
import { useI18n } from '../i18n/I18nProvider.tsx'

function AppNav(): JSX.Element {
  const location = useLocation()
  const { locale, setLocale, t } = useI18n()

  const handleLanguageChange = (nextLocale: string) => {
    setLocale(nextLocale)
    const params = new URLSearchParams(location.search)
    params.set('lang', nextLocale)

    const basePath = import.meta.env.BASE_URL
    const pathname = location.pathname.startsWith(basePath)
      ? location.pathname.slice(basePath.length)
      : location.pathname
    window.history.replaceState(window.history.state, '', `${basePath}${pathname}?${params.toString()}`)
  }

  return (
    <nav className="app-top-nav" aria-label={t('nav.mainAria')}>
      <div className="app-top-nav__brand">🏐 Bcoach</div>
      <div className="app-top-nav__right">
        <div className="app-top-nav__links">
          <NavLink to="/" end className={({ isActive }) => `app-top-nav__link ${isActive ? 'active' : ''}`}>
            {t('nav.home')}
          </NavLink>
          <NavLink to="/training" className={({ isActive }) => `app-top-nav__link ${isActive ? 'active' : ''}`}>
            {t('nav.training')}
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `app-top-nav__link ${isActive ? 'active' : ''}`}>
            {t('nav.history')}
          </NavLink>
        </div>

        <div className="app-top-nav__lang" role="group" aria-label={t('nav.language')}>
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
          <button
            type="button"
            className={locale === 'es' ? 'active' : ''}
            onClick={() => handleLanguageChange('es')}
          >
            ES
          </button>
        </div>
      </div>
    </nav>
  )
}

export default AppNav
