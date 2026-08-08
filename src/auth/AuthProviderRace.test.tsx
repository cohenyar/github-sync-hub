// @vitest-environment jsdom
//
// Auth-state race fix pass — dedicated to the exact bug reported from
// Lovable Preview: env vars present, but the UI inconsistently showed
// "unavailable" instead of a neutral loading state while the Cloud client
// was still resolving, and (separately) `status` could get stuck at
// 'loading' forever if the client ultimately resolved to null. Each test
// here uses `vi.doMock` + a fresh dynamic import per case (rather than the
// file-level `vi.mock` the other AuthProvider test files use) specifically
// so cloudClientPromise's resolution can be controlled per test — a real
// dynamic `import()` of the same specifier is memoized within one module
// graph, and a real page load's timing can't be replayed at will, so this
// is the direct way to drive "still pending," "resolves after several
// ticks," and "resolves to null" deterministically.
//
// Every test below is also, itself, exactly what a "refresh" and a "hard
// refresh" are in a real browser: a brand-new module graph and a brand-new
// React tree, each independently reflecting whatever cloudClientPromise
// settles to for that one load — there is no persisted module-level state
// that could leak between them. Running several such independent mounts,
// each with its own scripted outcome (pending→ready, straight-to-null,
// slow-then-ready), is what refresh coverage actually looks like here.
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthContextValue } from './types'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

function fakeClient() {
  return {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(),
  }
}

function Probe({ useAuthHook }: { useAuthHook: () => AuthContextValue }) {
  const auth = useAuthHook()
  return (
    <div>
      <span data-testid="status">{auth.status}</span>
      <span data-testid="configured">{String(auth.configured)}</span>
      <span data-testid="pending">{String(auth.cloudClientPending)}</span>
      <span data-testid="load-failed">{String(auth.cloudClientLoadFailed)}</span>
    </div>
  )
}

beforeEach(() => {
  vi.resetModules()
})

describe('AuthProvider — Cloud client resolution race (auth-state race fix pass)', () => {
  it('env present + client pending: shows pending, not unavailable — configured and load-failed both stay false', async () => {
    const client = deferred<ReturnType<typeof fakeClient> | null>()
    vi.doMock('./supabaseClient', () => ({ isSupabaseConfigured: true, cloudClientPromise: client.promise }))
    const { AuthProvider } = await import('./AuthProvider')
    const { useAuth } = await import('./useAuth')

    render(
      <AuthProvider>
        <Probe useAuthHook={useAuth} />
      </AuthProvider>,
    )

    expect(screen.getByTestId('status')).toHaveTextContent('loading')
    expect(screen.getByTestId('pending')).toHaveTextContent('true')
    expect(screen.getByTestId('configured')).toHaveTextContent('false')
    expect(screen.getByTestId('load-failed')).toHaveTextContent('false')

    client.resolve(fakeClient())
    await waitFor(() => expect(screen.getByTestId('configured')).toHaveTextContent('true'))
    expect(screen.getByTestId('pending')).toHaveTextContent('false')
  })

  it('env present + client success: settles to configured=true, pending=false, load-failed=false', async () => {
    vi.doMock('./supabaseClient', () => ({ isSupabaseConfigured: true, cloudClientPromise: Promise.resolve(fakeClient()) }))
    const { AuthProvider } = await import('./AuthProvider')
    const { useAuth } = await import('./useAuth')

    render(
      <AuthProvider>
        <Probe useAuthHook={useAuth} />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('configured')).toHaveTextContent('true'))
    expect(screen.getByTestId('pending')).toHaveTextContent('false')
    expect(screen.getByTestId('load-failed')).toHaveTextContent('false')
  })

  // The bug this pass fixes: previously, this exact case (env present,
  // client resolves to null) left `status` stuck at 'loading' forever,
  // since the old effect returned early without ever calling setStatus
  // again once it learned the client was null.
  it('env present + client failure: status leaves \'loading\' (never stuck), load-failed becomes true, guest mode still usable', async () => {
    vi.doMock('./supabaseClient', () => ({ isSupabaseConfigured: true, cloudClientPromise: Promise.resolve(null) }))
    const { AuthProvider } = await import('./AuthProvider')
    const { useAuth } = await import('./useAuth')

    render(
      <AuthProvider>
        <Probe useAuthHook={useAuth} />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('signed-out'))
    expect(screen.getByTestId('configured')).toHaveTextContent('false')
    expect(screen.getByTestId('pending')).toHaveTextContent('false')
    expect(screen.getByTestId('load-failed')).toHaveTextContent('true')
  })

  // Lovable Preview-like delayed load: several ticks of genuinely still
  // resolving, with no premature "unavailable" flash anywhere along the way.
  it('a slow (delayed) client load stays pending through every intermediate tick, then resolves cleanly with no flicker', async () => {
    const client = deferred<ReturnType<typeof fakeClient>>()
    vi.doMock('./supabaseClient', () => ({ isSupabaseConfigured: true, cloudClientPromise: client.promise }))
    const { AuthProvider } = await import('./AuthProvider')
    const { useAuth } = await import('./useAuth')

    render(
      <AuthProvider>
        <Probe useAuthHook={useAuth} />
      </AuthProvider>,
    )

    for (let tick = 0; tick < 5; tick += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(screen.getByTestId('pending')).toHaveTextContent('true')
      expect(screen.getByTestId('configured')).toHaveTextContent('false')
      expect(screen.getByTestId('load-failed')).toHaveTextContent('false')
    }

    client.resolve(fakeClient())
    await waitFor(() => expect(screen.getByTestId('configured')).toHaveTextContent('true'))
    expect(screen.getByTestId('load-failed')).toHaveTextContent('false')
  })

  it('never configured at all: skips pending entirely, resolves straight to unavailable with no loading flash', async () => {
    vi.doMock('./supabaseClient', () => ({ isSupabaseConfigured: false, cloudClientPromise: Promise.resolve(null) }))
    const { AuthProvider } = await import('./AuthProvider')
    const { useAuth } = await import('./useAuth')

    render(
      <AuthProvider>
        <Probe useAuthHook={useAuth} />
      </AuthProvider>,
    )

    expect(screen.getByTestId('status')).toHaveTextContent('signed-out')
    expect(screen.getByTestId('pending')).toHaveTextContent('false')
    expect(screen.getByTestId('configured')).toHaveTextContent('false')
    expect(screen.getByTestId('load-failed')).toHaveTextContent('false')
  })
})
