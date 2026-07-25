// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { he } from '../i18n'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './useAuth'

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  signInWithOAuth: vi.fn(async () => ({ error: null })),
  signOut: vi.fn(async () => ({ error: null })),
  from: vi.fn(),
}))

vi.mock('./supabaseClient', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
      signInWithOAuth: mocks.signInWithOAuth,
      signOut: mocks.signOut,
    },
    from: mocks.from,
  },
}))

const FAKE_SESSION = {
  user: {
    id: 'user-123',
    email: 'student@example.com',
    user_metadata: { avatar_url: 'https://example.com/avatar.png' },
  },
} as const

function queryBuilder(result: { data: unknown; error: unknown }) {
  return { select: () => ({ eq: () => ({ single: () => Promise.resolve(result) }) }) }
}

function Probe() {
  const auth = useAuth()
  return (
    <div>
      <span data-testid="status">{auth.status}</span>
      <span data-testid="role">{auth.role ?? ''}</span>
      <span data-testid="email">{auth.user?.email ?? ''}</span>
      <span data-testid="error">{auth.authError ?? ''}</span>
      <button data-testid="sign-out" onClick={() => void auth.signOut()}>
        sign out
      </button>
    </div>
  )
}

afterEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('AuthProvider — fail-closed role resolution', () => {
  it('resolves to signed-in with the admin role on a valid profile row', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: FAKE_SESSION } })
    mocks.from.mockReturnValue(queryBuilder({ data: { role: 'admin' }, error: null }))

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('signed-in'))
    expect(screen.getByTestId('role')).toHaveTextContent('admin')
    expect(screen.getByTestId('email')).toHaveTextContent('student@example.com')
    expect(screen.getByTestId('error')).toHaveTextContent('')
  })

  it('never renders admin content before the session resolves (loading first)', async () => {
    let resolveSession!: (value: { data: { session: typeof FAKE_SESSION | null } }) => void
    mocks.getSession.mockReturnValue(
      new Promise((resolve) => {
        resolveSession = resolve
      }),
    )
    mocks.from.mockReturnValue(queryBuilder({ data: { role: 'admin' }, error: null }))

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    expect(screen.getByTestId('status')).toHaveTextContent('loading')

    resolveSession({ data: { session: FAKE_SESSION } })
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('signed-in'))
  })

  it('denies admin access when the profiles query errors (missing row or query failure)', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: FAKE_SESSION } })
    mocks.from.mockReturnValue(queryBuilder({ data: null, error: { message: 'no rows found' } }))

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('signed-in'))
    expect(screen.getByTestId('role')).toHaveTextContent('')
    expect(screen.getByTestId('error')).toHaveTextContent(he.authProfileErrorMessage)
  })

  it('denies admin access when the role value is not a recognized role', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: FAKE_SESSION } })
    mocks.from.mockReturnValue(queryBuilder({ data: { role: 'superuser' }, error: null }))

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('signed-in'))
    expect(screen.getByTestId('role')).toHaveTextContent('')
    expect(screen.getByTestId('error')).toHaveTextContent(he.authProfileErrorMessage)
  })

  it('falls back to signed-out with a readable error when Supabase is unreachable, leaving guest mode usable', async () => {
    mocks.getSession.mockRejectedValue(new Error('network down'))

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('signed-out'))
    expect(screen.getByTestId('error')).toHaveTextContent(he.authUnavailableMessage)
  })

  it('sign-out clears the session but never touches the existing localStorage save', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: FAKE_SESSION } })
    mocks.from.mockReturnValue(queryBuilder({ data: { role: 'student' }, error: null }))
    localStorage.setItem('meridian:save', 'untouched-save-payload')

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('signed-in'))

    screen.getByTestId('sign-out').click()

    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledTimes(1))
    expect(localStorage.getItem('meridian:save')).toBe('untouched-save-payload')
  })
})
