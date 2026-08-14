// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../auth'
import type { AuthContextValue } from '../auth'
import { he } from '../i18n'
import { AuthPage } from './AuthPage'

const BASE_AUTH: AuthContextValue = {
  status: 'signed-out',
  user: null,
  role: null,
  isAdmin: false,
  authError: null,
  configured: true,
  isGuest: false,
  continueAsGuest: vi.fn(),
  signInWithGoogle: vi.fn(async () => {}),
  signUpWithEmail: vi.fn(async () => ({ error: null })),
  signInWithEmail: vi.fn(async () => ({ error: null })),
  sendPasswordReset: vi.fn(async () => ({ error: null })),
  updatePassword: vi.fn(async () => ({ error: null })),
  signOut: vi.fn(async () => {}),
}

function renderAuthPage() {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={BASE_AUTH}>
        <AuthPage />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('AuthPage', () => {
  it('shows the Meridian brand mark as a real link to "/" (global logo navigation)', () => {
    renderAuthPage()
    expect(screen.getByTestId('auth-brand-link')).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Meridian' })).toBeInTheDocument()
  })

  it('renders the sign-in form by default', () => {
    renderAuthPage()
    expect(screen.getByTestId('auth-page')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: he.authSignInTitle })).toBeInTheDocument()
  })
})
