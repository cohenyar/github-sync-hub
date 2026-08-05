// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AppRoutes } from './App'
import { AuthProvider } from './auth'
import { he } from './i18n'
import { markOnboardingComplete } from './onboarding'

// GameApp (mounted at /world) needs the same test-friendly database loader
// every existing GameApp test already relies on.
// Guest-visitor routing: no Cloud session in these tests, so the auth
// client is stubbed as unconfigured — AuthProvider resolves synchronously to
// signed-out/guest and no network call is made.
vi.mock('./auth/supabaseClient', () => ({ isSupabaseConfigured: false, supabase: null }))

vi.mock('./db/database', async () => {
  const { createTestDatabase } = await import('./verifier/testDb')
  return { createDatabase: createTestDatabase }
})

// AuthProvider mirrors App.tsx's real tree. With no VITE_SUPABASE_* env vars
// set in tests, it resolves synchronously to signed-out/guest — every route
// below renders exactly as it did before auth existed, except /admin.
function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('Routing foundation', () => {
  it('renders the landing page at /', () => {
    renderAt('/')
    expect(screen.getByText(he.landingTagline)).toBeInTheDocument()
  })

  // Onboarding: a fresh visit to /world now shows the boot sequence, then
  // the World Scene (not the classic dashboard) by default — see
  // onboarding.spec.ts / onboardingFlow.test.tsx for that flow itself.
  // These two tests are specifically about the classic dashboard/SQL
  // console rendering at /world, so each pre-seeds the onboarding flag (as
  // a returning player would have) and switches to the classic view via the
  // existing toggle, exactly as a player would.
  it('renders the real game, unwrapped, at /world', async () => {
    markOnboardingComplete()
    renderAt('/world')
    fireEvent.click(await screen.findByTestId('settings-menu-button'))
    fireEvent.click(await screen.findByTestId('toggle-world-scene-button'))
    expect(await screen.findByRole('button', { name: he.run })).toBeInTheDocument()
  })

  it('renders the real game at /world?path=math too (Batch 3A.2 query param), with no crash', async () => {
    markOnboardingComplete()
    renderAt('/world?path=math')
    fireEvent.click(await screen.findByTestId('settings-menu-button'))
    fireEvent.click(await screen.findByTestId('toggle-world-scene-button'))
    expect(await screen.findByRole('button', { name: he.run })).toBeInTheDocument()
  })

  it.each([
    ['/courses', he.navCoursesLabel],
    ['/tutor', he.navTutorLabel],
    ['/progress', he.navProgressLabel],
    ['/profile', he.navProfileLabel],
  ])('renders the %s placeholder', (path, title) => {
    renderAt(path)
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
  })

  it('renders the subject-selection dashboard at /dashboard', () => {
    renderAt('/dashboard')
    expect(screen.getByRole('heading', { name: he.dashboardHeading })).toBeInTheDocument()
    expect(screen.getByTestId('subject-card-math')).toBeInTheDocument()
    expect(screen.getByTestId('subject-card-english')).toBeInTheDocument()
  })

  it('reads the :courseId param on /courses/:courseId', () => {
    renderAt('/courses/sql-basics')
    expect(screen.getByText(`${he.courseDetailPrefix}sql-basics`)).toBeInTheDocument()
  })

  it('renders NotFound for an unknown path, with a way back to the landing page', () => {
    renderAt('/this-route-does-not-exist')
    expect(screen.getByText(he.notFoundTitle)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: he.notFoundBackLink })).toHaveAttribute('href', '/')
  })

  it('redirects a guest visitor away from /admin, back to the landing page', () => {
    renderAt('/admin')
    expect(screen.getByText(he.landingTagline)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Admin Area' })).not.toBeInTheDocument()
  })

  it('renders the dev-only design-system QA page in a dev build (the test environment)', () => {
    renderAt('/dev/design-system')
    expect(screen.queryByText(he.notFoundTitle)).not.toBeInTheDocument()
  })

  it('Meridian 1.0 UI audit: /dev/design-system does not exist at all in a production build, falling through to NotFound', () => {
    vi.stubEnv('DEV', false)
    renderAt('/dev/design-system')
    expect(screen.getByText(he.notFoundTitle)).toBeInTheDocument()
    vi.unstubAllEnvs()
  })
})
