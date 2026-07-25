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
  signInWithGoogle: vi.fn(async () => {}),
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
  it('renders nothing when Supabase is not configured', () => {
    const { container } = render(
      <AuthContext.Provider value={{ ...BASE_AUTH, configured: false }}>
        <AuthButton />
      </AuthContext.Provider>,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('shows a loading state while the session resolves', () => {
    renderButton({ status: 'loading' })
    expect(screen.getByTestId('auth-loading')).toHaveTextContent(he.authLoadingMessage)
  })

  it('shows a Google sign-in button when signed out, and calls signInWithGoogle on click', () => {
    const value = renderButton({ status: 'signed-out' })
    fireEvent.click(screen.getByTestId('google-sign-in-button'))
    expect(value.signInWithGoogle).toHaveBeenCalledTimes(1)
  })

  it('shows the account email and a sign-out button when signed in', () => {
    const value = renderButton({
      status: 'signed-in',
      user: { id: 'u1', email: 'student@example.com', avatarUrl: null },
    })
    expect(screen.getByTestId('auth-account')).toHaveTextContent('student@example.com')
    fireEvent.click(screen.getByTestId('sign-out-button'))
    expect(value.signOut).toHaveBeenCalledTimes(1)
  })

  it('shows the avatar image when available', () => {
    const { container } = render(
      <AuthContext.Provider
        value={{
          ...BASE_AUTH,
          status: 'signed-in',
          user: { id: 'u1', email: 'student@example.com', avatarUrl: 'https://example.com/a.png' },
        }}
      >
        <AuthButton />
      </AuthContext.Provider>,
    )
    // alt="" marks the avatar as decorative (the adjacent email text already
    // identifies the account), so it has no accessible "img" role — query
    // the element directly instead.
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/a.png')
  })

  it('shows a readable error (and still offers sign-out) when the profile failed to resolve', () => {
    renderButton({
      status: 'signed-in',
      user: { id: 'u1', email: 'student@example.com', avatarUrl: null },
      authError: he.authProfileErrorMessage,
    })
    expect(screen.getByTestId('auth-error')).toHaveTextContent(he.authProfileErrorMessage)
    expect(screen.getByTestId('sign-out-button')).toBeInTheDocument()
  })
})
