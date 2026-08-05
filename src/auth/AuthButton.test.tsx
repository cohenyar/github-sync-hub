// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { he } from '../i18n'
import { AuthContext } from './AuthProvider'
import { AuthButton } from './AuthButton'
import type { AuthContextValue } from './types'

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

function renderButton(authValue: Partial<AuthContextValue> = {}) {
  const value = { ...BASE_AUTH, ...authValue }
  render(
    <AuthContext.Provider value={value}>
      <AuthButton />
    </AuthContext.Provider>,
  )
  return value
}

describe('AuthButton', () => {
  it('shows a visible, honest not-configured notice instead of rendering nothing when Supabase is not configured', () => {
    render(
      <AuthContext.Provider value={{ ...BASE_AUTH, configured: false }}>
        <AuthButton />
      </AuthContext.Provider>,
    )
    expect(screen.getByTestId('auth-not-configured')).toHaveTextContent(he.authNotConfiguredShortLabel)
    expect(screen.getByTestId('auth-not-configured')).toHaveAttribute('title', he.authNotConfiguredMessage)
    expect(screen.getByTestId('guest-mode-badge')).toHaveTextContent(he.guestModeLabel)
  })

  it('still shows the Guest badge alongside the normal sign-in controls once Supabase is configured', () => {
    renderButton({ status: 'signed-out' })
    expect(screen.getByTestId('guest-mode-badge')).toHaveTextContent(he.guestModeLabel)
    expect(screen.getByTestId('google-sign-in-button')).toBeInTheDocument()
  })

  it('shows a loading state while the session resolves', () => {
    renderButton({ status: 'loading' })
    expect(screen.getByTestId('auth-loading')).toHaveTextContent(he.authLoadingMessage)
  })

  it('shows a clearly visible Google sign-in action when signed out, and calls signInWithGoogle on click', () => {
    const value = renderButton({ status: 'signed-out' })
    const signInButton = screen.getByTestId('google-sign-in-button')
    expect(signInButton).toHaveAttribute('data-variant', 'primary')
    fireEvent.click(signInButton)
    expect(value.signInWithGoogle).toHaveBeenCalledTimes(1)
  })

  it('shows the account trigger closed by default, with the sign-out menu item not yet in the document', () => {
    renderButton({
      status: 'signed-in',
      user: { id: 'u1', email: 'student@example.com', avatarUrl: null, displayName: null },
    })
    expect(screen.getByTestId('auth-account')).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByTestId('sign-out-button')).not.toBeInTheDocument()
  })

  it('falls back to email as the trigger label when no display name is available', () => {
    renderButton({
      status: 'signed-in',
      user: { id: 'u1', email: 'student@example.com', avatarUrl: null, displayName: null },
    })
    expect(screen.getByTestId('auth-account')).toHaveTextContent('student@example.com')
  })

  it('shows the display name (not the raw email) on the trigger when one is available', () => {
    renderButton({
      status: 'signed-in',
      user: { id: 'u1', email: 'student@example.com', avatarUrl: null, displayName: 'תלמיד לדוגמה' },
    })
    expect(screen.getByTestId('auth-account')).toHaveTextContent('תלמיד לדוגמה')
  })

  it('opens the account menu on click and shows the display name, email, and a Sign out action', () => {
    renderButton({
      status: 'signed-in',
      user: { id: 'u1', email: 'student@example.com', avatarUrl: null, displayName: 'תלמיד לדוגמה' },
    })

    fireEvent.click(screen.getByTestId('auth-account'))

    expect(screen.getByTestId('auth-account')).toHaveAttribute('aria-expanded', 'true')
    const menu = screen.getByRole('menu')
    expect(menu).toHaveTextContent('תלמיד לדוגמה')
    expect(menu).toHaveTextContent('student@example.com')
    expect(screen.getByTestId('sign-out-button')).toBeInTheDocument()
  })

  it('signing out closes the menu and calls the shared AuthProvider signOut', () => {
    const value = renderButton({
      status: 'signed-in',
      user: { id: 'u1', email: 'student@example.com', avatarUrl: null, displayName: null },
    })

    fireEvent.click(screen.getByTestId('auth-account'))
    fireEvent.click(screen.getByTestId('sign-out-button'))

    expect(value.signOut).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('immediately shows Guest state after sign-out, with no stale name/email/avatar left over (desktop and mobile render the same component tree)', () => {
    const signedIn: AuthContextValue = {
      ...BASE_AUTH,
      status: 'signed-in',
      user: { id: 'u1', email: 'student@example.com', avatarUrl: null, displayName: 'תלמיד לדוגמה' },
    }
    const { rerender } = render(
      <AuthContext.Provider value={signedIn}>
        <AuthButton />
      </AuthContext.Provider>,
    )
    expect(screen.getByTestId('auth-account')).toHaveTextContent('תלמיד לדוגמה')

    // The exact transition AuthProvider's own onAuthStateChange produces on
    // a successful sign-out: user clears and status returns to signed-out.
    rerender(
      <AuthContext.Provider value={{ ...BASE_AUTH, status: 'signed-out', user: null }}>
        <AuthButton />
      </AuthContext.Provider>,
    )

    expect(screen.queryByTestId('auth-account')).not.toBeInTheDocument()
    expect(screen.queryByText('תלמיד לדוגמה')).not.toBeInTheDocument()
    expect(screen.queryByText('student@example.com')).not.toBeInTheDocument()
    expect(screen.getByTestId('guest-mode-badge')).toBeInTheDocument()
    expect(screen.getByTestId('google-sign-in-button')).toBeInTheDocument()
  })

  it('closes the menu on Escape', () => {
    renderButton({
      status: 'signed-in',
      user: { id: 'u1', email: 'student@example.com', avatarUrl: null, displayName: null },
    })

    fireEvent.click(screen.getByTestId('auth-account'))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('shows the avatar image when available', () => {
    const { container } = render(
      <AuthContext.Provider
        value={{
          ...BASE_AUTH,
          status: 'signed-in',
          user: { id: 'u1', email: 'student@example.com', avatarUrl: 'https://example.com/a.png', displayName: null },
        }}
      >
        <AuthButton />
      </AuthContext.Provider>,
    )
    // alt="" marks the avatar as decorative (the adjacent name/email text
    // already identifies the account), so it has no accessible "img" role —
    // query the element directly instead.
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/a.png')
  })

  it('shows a fallback initial when no avatar image is available', () => {
    renderButton({
      status: 'signed-in',
      user: { id: 'u1', email: 'student@example.com', avatarUrl: null, displayName: 'תלמיד לדוגמה' },
    })
    expect(screen.getByTestId('auth-account')).toHaveTextContent('ת')
  })

  it('shows a readable error inside the account menu (and still offers sign-out) when the profile failed to resolve', () => {
    renderButton({
      status: 'signed-in',
      user: { id: 'u1', email: 'student@example.com', avatarUrl: null, displayName: null },
      authError: he.authProfileErrorMessage,
    })

    fireEvent.click(screen.getByTestId('auth-account'))

    expect(screen.getByTestId('auth-error')).toHaveTextContent(he.authProfileErrorMessage)
    expect(screen.getByTestId('sign-out-button')).toBeInTheDocument()
  })
})
