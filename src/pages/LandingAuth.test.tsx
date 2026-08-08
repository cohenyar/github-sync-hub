// @vitest-environment jsdom
//
// No prior coverage existed for this component before the auth-state race
// fix pass — it's the exact surface the original bug report screenshotted
// (the landing page's own auth block, distinct from AuthButton/WelcomeScreen
// elsewhere in the app), so it's covered directly here rather than only
// indirectly through other components' tests.
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../auth/AuthProvider'
import type { AuthContextValue } from '../auth/types'
import { he } from '../i18n'
import { LandingAuth } from './LandingAuth'

function baseAuth(): AuthContextValue {
  return {
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
}

function renderLandingAuth(authValue: Partial<AuthContextValue> = {}) {
  const value = { ...baseAuth(), ...authValue }
  render(
    <MemoryRouter>
      <AuthContext.Provider value={value}>
        <LandingAuth />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
  return value
}

describe('LandingAuth — no AuthProvider ancestor', () => {
  it('renders nothing rather than crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <LandingAuth />
      </MemoryRouter>,
    )
    expect(container).toBeEmptyDOMElement()
  })
})

describe('LandingAuth — Cloud client still resolving (auth-state race fix pass)', () => {
  // The exact bug reported from Lovable Preview: this branch is checked
  // BEFORE `!configured` here already (unlike AuthButton, which needed
  // fixing) — `configured` is false for the whole pending window, so
  // getting this order right is what keeps the unavailable notice from
  // flashing on every refresh where the client just hasn't resolved yet.
  it('shows the neutral loading state, never the unavailable notice, while status is \'loading\'', () => {
    renderLandingAuth({ status: 'loading', configured: false, cloudClientPending: true })
    expect(screen.getByTestId('auth-loading')).toHaveTextContent(he.authLoadingMessage)
    expect(screen.queryByTestId('auth-unavailable')).not.toBeInTheDocument()
    expect(screen.queryByTestId('google-sign-in-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('continue-as-guest-button')).not.toBeInTheDocument()
  })
})

describe('LandingAuth — confirmed unavailable (client settled to null)', () => {
  it('shows the unavailable notice with recovery actions once the client has confirmed failure — not before', () => {
    const retryCloudConnection = vi.fn()
    renderLandingAuth({ status: 'signed-out', configured: false, cloudClientLoadFailed: true, retryCloudConnection })
    expect(screen.getByTestId('auth-unavailable')).toHaveTextContent(he.authUnavailableMessage)
    expect(screen.getByTestId('continue-as-guest-button')).toBeInTheDocument()
    // Actionable, not a dead end: retry the client load in place, or go to
    // the full auth page (which owns email sign-in/sign-up).
    fireEvent.click(screen.getByTestId('auth-retry-button'))
    expect(retryCloudConnection).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('auth-page-link')).toBeInTheDocument()
    // Google still stays hidden here: the managed OAuth call needs the client.
    expect(screen.queryByTestId('google-sign-in-button')).not.toBeInTheDocument()
  })

  it('calling Guest works from the unavailable state', () => {
    const continueAsGuest = vi.fn()
    renderLandingAuth({ configured: false, continueAsGuest })
    fireEvent.click(screen.getByTestId('continue-as-guest-button'))
    expect(continueAsGuest).toHaveBeenCalledTimes(1)
  })
})

describe('LandingAuth — client ready, signed out (required stable behavior)', () => {
  it('shows Google, the email/sign-in link, and Guest all together, and keeps them stable', () => {
    renderLandingAuth({ status: 'signed-out', configured: true })
    expect(screen.getByTestId('google-sign-in-button')).toBeInTheDocument()
    expect(screen.getByTestId('auth-page-link')).toBeInTheDocument()
    expect(screen.getByTestId('continue-as-guest-button')).toBeInTheDocument()
  })

  it('Google sign-in and Guest both call through to the real handlers', () => {
    const signInWithGoogle = vi.fn(async () => {})
    const continueAsGuest = vi.fn()
    renderLandingAuth({ status: 'signed-out', configured: true, signInWithGoogle, continueAsGuest })

    fireEvent.click(screen.getByTestId('google-sign-in-button'))
    expect(signInWithGoogle).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByTestId('continue-as-guest-button'))
    expect(continueAsGuest).toHaveBeenCalledTimes(1)
  })

  it('shows a scoped auth error alongside the normal actions, without hiding them', () => {
    renderLandingAuth({ status: 'signed-out', configured: true, authError: 'משהו השתבש' })
    expect(screen.getByTestId('auth-error')).toHaveTextContent('משהו השתבש')
    expect(screen.getByTestId('google-sign-in-button')).toBeInTheDocument()
  })
})

describe('LandingAuth — signed in', () => {
  it('shows the signed-in badge and a working Sign out action', () => {
    const signOut = vi.fn(async () => {})
    renderLandingAuth({
      status: 'signed-in',
      configured: true,
      signOut,
      user: { id: 'u1', email: 'student@example.com', avatarUrl: null, displayName: 'תלמיד לדוגמה' },
    })
    expect(screen.getByTestId('auth-signed-in-badge')).toHaveTextContent('תלמיד לדוגמה')

    fireEvent.click(screen.getByTestId('sign-out-button'))
    expect(signOut).toHaveBeenCalledTimes(1)
  })
})
