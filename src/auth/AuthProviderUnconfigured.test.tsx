// @vitest-environment jsdom
//
// Deliberately does NOT mock ./supabaseClient — every test run in this repo
// has no VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY set (no .env files exist),
// so isSupabaseConfigured is genuinely false here, exactly as it would be
// for a real deployment that hasn't configured Supabase yet.
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { isSupabaseConfigured } from './supabaseClient'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './useAuth'

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
    expect(isSupabaseConfigured).toBe(false)

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
