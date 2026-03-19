import { NavLink } from 'react-router-dom'

function AppNav(): JSX.Element {
  return (
    <nav className="app-top-nav" aria-label="Huvudnavigering">
      <div className="app-top-nav__brand">🏐 Bcoach</div>
      <div className="app-top-nav__links">
        <NavLink to="/" end className={({ isActive }) => `app-top-nav__link ${isActive ? 'active' : ''}`}>
          Hem
        </NavLink>
        <NavLink to="/training" className={({ isActive }) => `app-top-nav__link ${isActive ? 'active' : ''}`}>
          Träning
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => `app-top-nav__link ${isActive ? 'active' : ''}`}>
          Mina videos
        </NavLink>
      </div>
    </nav>
  )
}

export default AppNav
