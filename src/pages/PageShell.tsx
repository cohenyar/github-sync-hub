import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { he } from '../i18n'
import styles from './pages.module.css'

const NAV_LINKS = [
  { to: '/', label: he.navLandingLabel },
  { to: '/dashboard', label: he.navDashboardLabel },
  { to: '/world', label: he.navWorldLabel },
  { to: '/courses', label: he.navCoursesLabel },
  { to: '/tutor', label: he.navTutorLabel },
  { to: '/progress', label: he.navProgressLabel },
  { to: '/profile', label: he.navProfileLabel },
]

/**
 * Routing-foundation shell for every placeholder page — a minimal nav bar
 * plus the page's own content. Deliberately NOT used by /world: the real
 * game keeps rendering GameApp alone, with nothing wrapped around it, so
 * its behavior stays byte-for-byte unchanged.
 */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <nav className={styles.nav} aria-label={he.navLandingLabel}>
        {NAV_LINKS.map((link) => (
          <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? styles.active : undefined)}>
            {link.label}
          </NavLink>
        ))}
      </nav>
      {children}
    </div>
  )
}
