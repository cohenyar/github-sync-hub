// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { he } from '../i18n'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './useAuth'

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(async () => ({ data: { session: null } })),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  lovableSignInWithOAuth: vi.fn(async () => ({ error: null, redirected: true })),
}))

vi.mock('../integrations/lovable/index', () => ({
  lovable: { auth: { signInWithOAuth: mocks.lovableSignInWithOAuth } },
}))

// The one thing this file exists to flip, relative to AuthProvider.test.tsx.
vi.mock('./runtimeEnvironment', () => ({ isLocalDevRuntime: true }))

vi.mock('./supabaseClient', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: { getSession: mocks.getSession, onAuthStateChange: mocks.onAuthStateChange },
    from: vi.fn(),
  },
}))

function Probe() {
  const auth = useAuth()
  return (
    <div>
      <span data-testid="status">{auth.status}</span>
      <span data-testid="error">{auth.authError ?? ''}</span>
      <span data-testid="is-guest">{String(auth.isGuest)}</span>
      <button data-testid="sign-in" onClick={() => void auth.signInWithGoogle()}>
        sign in
      </button>
    </div>
  )
}

afterEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('AuthProvider — Google sign-in on a local dev runtime (H1/playtest fix)', () => {
  it('never calls the Lovable OAuth broker, and shows the local-dev explanation instead of navigating', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('signed-out'))

    screen.getByTestId('sign-in').click()

    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent(he.authGoogleLocalDevMessage))
    // The one call that would have produced the /~oauth/initiate navigation
    // and the resulting 404 never happens at all.
    expect(mocks.lovableSignInWithOAuth).not.toHaveBeenCalled()
  })

  it('leaves guest state untouched by the blocked attempt (no accidental clearGuest side effect)', async () => {
    localStorage.setItem('meridian:guest', 'true')

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('signed-out'))
    expect(screen.getByTestId('is-guest')).toHaveTextContent('true')

    screen.getByTestId('sign-in').click()

    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent(he.authGoogleLocalDevMessage))
    expect(screen.getByTestId('is-guest')).toHaveTextContent('true')
  })
})
