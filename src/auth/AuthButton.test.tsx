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

  // Playtest fix pass — env vars present but the client failed to load is a
  // distinct condition from genuinely unconfigured, and used to incorrectly
  // show the exact same "missing env vars" text either way.
  it('shows an accurate "cloud service failed to load" notice — not the "missing env vars" one — when cloudClientLoadFailed is true', () => {
    render(
      <AuthContext.Provider value={{ ...BASE_AUTH, configured: false, cloudClientLoadFailed: true }}>
        <AuthButton />
      </AuthContext.Provider>,
    )
    const notice = screen.getByTestId('auth-not-configured')
    expect(notice).toHaveTextContent(he.authCloudLoadFailedShortLabel)
    expect(notice).toHaveAttribute('title', he.authCloudLoadFailedMessage)
    expect(notice).not.toHaveTextContent(he.authNotConfiguredShortLabel)
    expect(notice).not.toHaveAttribute('title', he.authNotConfiguredMessage)
  })

  // Auth-state race fix pass — the actual bug reported from Lovable
  // Preview: `configured` is false for the ENTIRE time the Cloud client
  // hasn't settled yet, not just once confirmed unavailable. This used to
  // be checked before the loading check, so a page load where the client
  // just hadn't resolved by render time incorrectly showed "unavailable"
  // instead of the neutral loading state.
  it('shows the neutral loading state, never the unavailable notice, while status is still \'loading\' (the pending window)', () => {
    render(
      <AuthContext.Provider value={{ ...BASE_AUTH, status: 'loading', configured: false, cloudClientPending: true }}>
        <AuthButton />
      </AuthContext.Provider>,
    )
    expect(screen.getByTestId('auth-loading')).toHaveTextContent(he.authLoadingMessage)
    expect(screen.queryByTestId('auth-not-configured')).not.toBeInTheDocument()
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

describe('AuthButton — mobile layout (H2 fix)', () => {
  // jsdom does not evaluate width-based @media queries or compute real
  // layout, so these check the DOM/semantic contract the CSS breakpoint in
  // AuthButton.module.css relies on (present, correctly labeled, correctly
  // wired to state) — not real viewport geometry. Geometry itself (no
  // overflow at 320/375/390/412px and Pixel 7, no HUD overlap) is verified
  // in a real browser by e2e/auth-mobile-layout.spec.ts.
  it('renders a collapsed mobile trigger alongside the always-visible actions row, both present regardless of viewport', () => {
    renderButton({ status: 'signed-out' })

    const trigger = screen.getByTestId('auth-mobile-menu-trigger')
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveAccessibleName(he.authMobileMenuLabel)

    // The three actions the trigger reveals on a narrow viewport are always
    // in the DOM (CSS alone hides them below the breakpoint) — never
    // duplicated, never removed.
    expect(screen.getByTestId('google-sign-in-button')).toBeInTheDocument()
    expect(screen.getByTestId('auth-page-link')).toBeInTheDocument()
    expect(screen.getByTestId('email-auth-toggle-button')).toBeInTheDocument()
    expect(screen.getAllByTestId('google-sign-in-button')).toHaveLength(1)
  })

  it('opening the mobile trigger is independent of the email form toggle — it does not jump straight to the form', () => {
    renderButton({ status: 'signed-out' })

    fireEvent.click(screen.getByTestId('auth-mobile-menu-trigger'))
    expect(screen.getByTestId('auth-mobile-menu-trigger')).toHaveAttribute('aria-expanded', 'true')
    expect(screen.queryByTestId('email-password-form')).not.toBeInTheDocument()
    expect(screen.getByTestId('email-auth-toggle-button')).toHaveAttribute('aria-expanded', 'false')

    // From there, the existing email toggle still works exactly as before.
    fireEvent.click(screen.getByTestId('email-auth-toggle-button'))
    expect(screen.getByTestId('email-password-form')).toBeInTheDocument()
  })

  it('closing on outside click or Escape collapses both the mobile popover and the email form together', () => {
    renderButton({ status: 'signed-out' })

    fireEvent.click(screen.getByTestId('auth-mobile-menu-trigger'))
    fireEvent.click(screen.getByTestId('email-auth-toggle-button'))
    expect(screen.getByTestId('email-password-form')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByTestId('auth-mobile-menu-trigger')).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByTestId('email-password-form')).not.toBeInTheDocument()
  })

  it('the not-configured and loading branches render no mobile trigger — nothing there needs collapsing', () => {
    render(
      <AuthContext.Provider value={{ ...BASE_AUTH, configured: false }}>
        <AuthButton />
      </AuthContext.Provider>,
    )
    expect(screen.queryByTestId('auth-mobile-menu-trigger')).not.toBeInTheDocument()
  })

  it('the signed-in account trigger and menu are unaffected by the H2 fix — same controls, same behavior', () => {
    // Regression guard: H2 only touches the signed-out branch (a new
    // .mobileMenuTrigger/.signedOutActions wrapper) plus a shared,
    // desktop-neutral .menu max-width — the signed-in trigger/menu markup
    // itself is untouched.
    renderButton({
      status: 'signed-in',
      user: { id: 'u1', email: 'student@example.com', avatarUrl: null, displayName: 'תלמיד לדוגמה' },
    })
    expect(screen.queryByTestId('auth-mobile-menu-trigger')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('auth-account'))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByTestId('sign-out-button')).toBeInTheDocument()
  })
})
