// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthContext } from '../auth'
import type { AuthContextValue } from '../auth'
import { he } from '../i18n'
import { PageShell } from './PageShell'

const STUDENT_AUTH: AuthContextValue = {
  status: 'signed-out',
  user: null,
  role: null,
  isAdmin: false,
  authError: null,
  configured: false,
  isGuest: false,
  continueAsGuest: () => {},
  signInWithGoogle: async () => {},
  signUpWithEmail: async () => ({ error: null }),
  signInWithEmail: async () => ({ error: null }),
  sendPasswordReset: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
  signOut: async () => {},
}

const ADMIN_AUTH: AuthContextValue = {
  ...STUDENT_AUTH,
  status: 'signed-in',
  user: { id: 'admin-1', email: 'admin@example.com', avatarUrl: null, displayName: null },
  role: 'admin',
  isAdmin: true,
  configured: true,
}

// PageShell reads useAuth() directly (for the Admin link + AuthButton), so
// every render needs an AuthContext in the tree — a real <AuthProvider>
// resolves to the same signed-out/guest value as STUDENT_AUTH when no
// VITE_SUPABASE_* env vars are set (as in every test run), so tests that
// don't care about auth can just render the shell plainly.
function renderShell(authValue: AuthContextValue = STUDENT_AUTH) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authValue}>
        <PageShell>
          <p>content</p>
        </PageShell>
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('PageShell', () => {
  it('links only to the routes that render real content', () => {
    renderShell()
    const nav = screen.getByRole('navigation')
    const links = nav.querySelectorAll('a')
    const hrefs = Array.from(links).map((link) => link.getAttribute('href'))

    expect(hrefs).toEqual(['/', '/dashboard', '/world'])
  })

  it('does not link to the hidden placeholder pages', () => {
    renderShell()
    const nav = screen.getByRole('navigation')
    for (const label of [he.navCoursesLabel, he.navTutorLabel, he.navProgressLabel, he.navProfileLabel]) {
      expect(nav.textContent).not.toContain(label)
    }
  })

  it('never shows the Admin link to a guest or a signed-in non-admin', () => {
    renderShell(STUDENT_AUTH)
    expect(screen.queryByRole('link', { name: he.navAdminLabel })).not.toBeInTheDocument()
  })

  it('shows the Admin link once the session resolves to the admin role', () => {
    renderShell(ADMIN_AUTH)
    expect(screen.getByRole('link', { name: he.navAdminLabel })).toHaveAttribute('href', '/admin')
  })
})
