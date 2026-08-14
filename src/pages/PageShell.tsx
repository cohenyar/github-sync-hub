import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { AuthButton, useAuth } from '../auth'
import { he } from '../i18n'
import styles from './pages.module.css'

// Phase 3A.1: trimmed to the routes that render real content. /courses,
// /tutor, /progress, /profile keep their routes and code (App.tsx) — they're
// just not linked from player-facing navigation until each has a real
// design.
const NAV_LINKS = [
  { to: '/', label: he.navLandingLabel },
  { to: '/dashboard', label: he.navDashboardLabel },
  { to: '/world', label: he.navWorldLabel },
]

/**
 * Routing-foundation shell for every placeholder page — a minimal nav bar
 * plus the page's own content. Deliberately NOT used by /world: the real
 * game keeps rendering GameApp alone, with nothing wrapped around it, so
 * its behavior stays byte-for-byte unchanged.
 *
 * Auth Phase 1: this is the one shared nav surface that gets the Admin link
 * and the sign-in/out control. The link is only ever rendered once `isAdmin`
 * is true — but that's a UX nicety, not the security boundary: /admin is
 * still independently protected by ProtectedAdminRoute (and, for any future
 * remote data, by Supabase RLS) regardless of whether this link is visible.
 */
export function PageShell({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth()

  return (
    <div className={styles.shell}>
      <nav className={styles.nav} aria-label={he.navLandingLabel}>
        <NavLink to="/" className={styles.brand} aria-label="Meridian" end>
          <span aria-hidden className={styles.brandMark} />
          <span className={styles.brandName}>Meridian</span>
        </NavLink>
        {NAV_LINKS.map((link) => (
          <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? styles.active : undefined)}>
            {link.label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink to="/admin" className={({ isActive }) => (isActive ? styles.active : undefined)}>
            {he.navAdminLabel}
          </NavLink>
        )}
        <AuthButton />
      </nav>
      {children}
    </div>
  )
}
