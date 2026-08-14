import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { he } from '../../i18n'
import styles from './AdminLayout.module.css'

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: he.adminNavDashboard },
  { to: '/admin/courses', label: he.adminNavCourses },
  { to: '/admin/users', label: he.adminNavUsers },
  { to: '/admin/legacy', label: he.adminNavLegacyTools },
]

/**
 * Chrome for everything under /admin/* — deliberately its own shell, not
 * PageShell (the player nav): the spec asks for the admin area to feel
 * cleaner/more operational than the game UI, and PageShell's nav is player-
 * facing navigation that doesn't belong here. Access control lives entirely
 * in ProtectedAdminRoute (App.tsx) + Supabase RLS, never in this component.
 */
export function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className={styles.shell} dir="rtl" lang="he">
      <header className={styles.topbar}>
        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={he.adminOpenMenuLabel}
          data-testid="admin-menu-toggle"
        >
          <span className={styles.menuBar} aria-hidden="true" />
          <span className={styles.menuBar} aria-hidden="true" />
          <span className={styles.menuBar} aria-hidden="true" />
        </button>
        <Link to="/" className={styles.brand} aria-label="Meridian">
          <span aria-hidden className={styles.brandMark} />
          <span className={styles.brandName}>Meridian</span>
        </Link>
        <span className={styles.title}>{he.adminAreaTitle}</span>
        <NavLink to="/dashboard" className={styles.backLink}>
          {he.adminBackToGame}
        </NavLink>
      </header>
      <div className={styles.body}>
        <nav
          className={menuOpen ? `${styles.sidebar} ${styles.sidebarOpen}` : styles.sidebar}
          aria-label={he.adminAreaTitle}
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
