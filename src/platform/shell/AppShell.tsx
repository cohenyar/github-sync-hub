import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import styles from './AppShell.module.css'

export interface AppShellNavItem {
  to: string
  label: string
  icon?: ReactNode
}

export interface AppShellProps {
  navItems?: AppShellNavItem[]
  actions?: ReactNode
  children: ReactNode
}

/**
 * AppShell — foundation layout for every non-/world route.
 *
 * Phase 0 only provides the primitive: a sticky glass topbar with brand and
 * desktop nav, a centered content column, and a mobile bottom tab bar. Real
 * pages (Landing, Dashboard, Courses, Tutor, Progress, Profile) are wired
 * to this shell in later phases; today it is only rendered by the hidden
 * /dev/design-system QA route so /world stays completely untouched.
 */
export function AppShell({ navItems = [], actions, children }: AppShellProps) {
  return (
    <div className={styles.root}>
      <header className={styles.topbar}>
        <NavLink to="/" className={styles.brand} aria-label="מרידיאן">
          <span aria-hidden className={styles.brandMark} />
          <span>מרידיאן</span>
        </NavLink>

        {navItems.length > 0 ? (
          <nav className={styles.navDesktop} aria-label="ניווט ראשי">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
              >
                {({ isActive }) => <span data-active={isActive}>{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        ) : null}

        <div>{actions}</div>
      </header>

      <main className={styles.content}>{children}</main>

      {navItems.length > 0 ? (
        <nav className={styles.bottomTabs} aria-label="ניווט תחתון">
          {navItems.map((item) => (
            <NavLink
              key={`bt-${item.to}`}
              to={item.to}
              end={item.to === '/'}
              className={styles.bottomTab}
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden
                    className={styles.bottomTabIcon}
                    data-active={isActive}
                  >
                    {item.icon ?? '•'}
                  </span>
                  <span data-active={isActive}>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      ) : null}
    </div>
  )
}
