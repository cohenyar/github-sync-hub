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
// `isLocalDevRuntime` is hostname-based in the real module (see
// runtimeEnvironment.ts) — mocked directly here rather than driven via a
// real window.location.hostname override, matching every other test file's
// convention for this module.
vi.mock('./runtimeEnvironment', () => ({ isLocalDevRuntime: true }))

vi.mock('./supabaseClient', () => ({
  isSupabaseConfigured: true,
  cloudClientPromise: Promise.resolve({
    auth: { getSession: mocks.getSession, onAuthStateChange: mocks.onAuthStateChange },
    from: vi.fn(),
  }),
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

describe('AuthProvider — Google sign-in on a true local host (localhost/127.0.0.1/::1)', () => {
  it('never calls the managed OAuth helper — shows the local-dev explanation instead', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('signed-out'))

    screen.getByTestId('sign-in').click()

    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent(he.authGoogleLocalDevMessage))
    expect(mocks.lovableSignInWithOAuth).not.toHaveBeenCalled()
  })

  it('still clears guest state when starting Google sign-in, even though the OAuth call is blocked', async () => {
    localStorage.setItem('meridian:guest', 'true')

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('signed-out'))
    expect(screen.getByTestId('is-guest')).toHaveTextContent('true')

    screen.getByTestId('sign-in').click()

    await waitFor(() => expect(screen.getByTestId('is-guest')).toHaveTextContent('false'))
    expect(mocks.lovableSignInWithOAuth).not.toHaveBeenCalled()
  })
})
