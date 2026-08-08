// @vitest-environment jsdom
//
// Lovable Cloud auth pass — the generated client (src/integrations/supabase/
// client.ts) now throws synchronously at import time if either env var is
// missing, so a genuinely-absent-env-var run is no longer something this
// suite can safely exercise unmocked (it would crash the whole test file,
// not just this one). This mocks ./supabaseClient directly to reproduce the
// same "Cloud not configured" state instead, preserving the one guarantee
// this file exists to protect: the app must not crash, and must fall back to
// guest mode with no admin access, when Cloud isn't configured.
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './useAuth'

vi.mock('./supabaseClient', () => ({
  isSupabaseConfigured: false,
  cloudClientPromise: Promise.resolve(null),
}))

function Probe() {
  const auth = useAuth()
  return (
    <div>
      <span data-testid="status">{auth.status}</span>
      <span data-testid="configured">{String(auth.configured)}</span>
      <span data-testid="is-admin">{String(auth.isAdmin)}</span>
    </div>
  )
}

describe('AuthProvider — missing Supabase configuration', () => {
  it('does not crash, and resolves straight to signed-out (guest) with no admin access', () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    expect(screen.getByTestId('status')).toHaveTextContent('signed-out')
    expect(screen.getByTestId('configured')).toHaveTextContent('false')
    expect(screen.getByTestId('is-admin')).toHaveTextContent('false')
  })
})
