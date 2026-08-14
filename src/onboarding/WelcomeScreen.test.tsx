// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../auth/AuthProvider'
import type { AuthContextValue } from '../auth/types'
import { he } from '../i18n'
import { WelcomeScreen, type WelcomeScreenProps } from './WelcomeScreen'

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

// A fresh vi.fn() per prop, per call — sharing one object across tests
// would let call counts silently accumulate across unrelated assertions.
function baseProps(): WelcomeScreenProps {
  return {
    hasProfile: false,
    onContinue: vi.fn(),
    onEditProfile: vi.fn(),
    isMuted: false,
    onToggleMuted: vi.fn(),
    confirmingNewGame: false,
    onRequestNewGame: vi.fn(),
    onConfirmNewGame: vi.fn(),
    onCancelNewGame: vi.fn(),
  }
}

function renderScreen(props: Partial<WelcomeScreenProps> = {}, authValue: Partial<AuthContextValue> | null = null) {
  const mergedProps = { ...baseProps(), ...props }
  const ui = <WelcomeScreen {...mergedProps} />
  if (authValue === null) {
    render(ui)
  } else {
    render(<AuthContext.Provider value={{ ...baseAuth(), ...authValue }}>{ui}</AuthContext.Provider>)
  }
  return mergedProps
}

describe('WelcomeScreen — branding and primary action', () => {
  it('shows the Meridian wordmark and tagline', () => {
    renderScreen()
    expect(screen.getByText('Meridian')).toBeInTheDocument()
    expect(screen.getByText(he.welcomeTagline)).toBeInTheDocument()
  })

  it('the wordmark is a real link to "/" once a Router ancestor exists (global logo navigation)', () => {
    render(
      <MemoryRouter>
        <WelcomeScreen {...baseProps()} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Meridian' })).toHaveAttribute('href', '/')
  })

  it('degrades to a plain, non-crashing wordmark with no Router ancestor (existing <GameApp/> test convention)', () => {
    renderScreen()
    expect(screen.getByText('Meridian')).toBeInTheDocument()
  })

  it('always shows Continue Journey, and calls onContinue when clicked', () => {
    const props = renderScreen()
    fireEvent.click(screen.getByTestId('welcome-continue-button'))
    expect(props.onContinue).toHaveBeenCalledTimes(1)
  })
})

describe('WelcomeScreen — current player profile', () => {
  it('shows no profile chip when there is no local profile yet', () => {
    renderScreen({ hasProfile: false })
    expect(screen.queryByTestId('welcome-profile-chip')).not.toBeInTheDocument()
  })

  it('shows the name and an edit action once a local profile exists', () => {
    const props = renderScreen({ hasProfile: true, playerName: 'נועה', playerAvatarId: 'azure' })
    const chip = screen.getByTestId('welcome-profile-chip')
    expect(chip).toHaveTextContent('נועה')

    fireEvent.click(screen.getByTestId('welcome-edit-profile-button'))
    expect(props.onEditProfile).toHaveBeenCalledTimes(1)
  })
})

describe('WelcomeScreen — auth (no AuthProvider ancestor, e.g. every existing <GameApp/> test)', () => {
  it('renders no sign-in UI, but still shows the Guest label (no account either way)', () => {
    renderScreen()
    expect(screen.queryByTestId('welcome-google-signin-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('welcome-guest-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('welcome-account-row')).not.toBeInTheDocument()
    expect(screen.getByTestId('welcome-guest-label')).toBeInTheDocument()
  })
})

describe('WelcomeScreen — auth unconfigured (Supabase env vars absent, the real deployment today)', () => {
  it('renders no sign-in/guest choice and no account row, but shows a visible Guest label and a config notice instead of nothing', () => {
    renderScreen({}, { configured: false })
    expect(screen.queryByTestId('welcome-google-signin-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('welcome-guest-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('welcome-account-row')).not.toBeInTheDocument()
    expect(screen.getByTestId('welcome-guest-label')).toHaveTextContent(he.guestModeLabel)
    expect(screen.getByTestId('welcome-auth-not-configured')).toHaveTextContent(he.authNotConfiguredMessage)
  })

  // Playtest fix pass — env vars present but the client failed to load is a
  // distinct condition, and used to incorrectly show this exact same
  // "missing env vars" text.
  it('shows the accurate "cloud service failed to load" message instead, when cloudClientLoadFailed is true', () => {
    renderScreen({}, { configured: false, cloudClientLoadFailed: true })
    const notice = screen.getByTestId('welcome-auth-not-configured')
    expect(notice).toHaveTextContent(he.authCloudLoadFailedMessage)
    expect(notice).not.toHaveTextContent(he.authNotConfiguredMessage)
  })
})

describe('WelcomeScreen — Cloud client still resolving (auth-state race fix pass)', () => {
  it('shows a neutral pending note, never the unavailable notice, and hides Google/Email until the client settles', () => {
    renderScreen({}, { status: 'loading', configured: false, cloudClientPending: true })
    expect(screen.getByTestId('welcome-auth-pending')).toHaveTextContent(he.authLoadingMessage)
    expect(screen.queryByTestId('welcome-auth-not-configured')).not.toBeInTheDocument()
    expect(screen.queryByTestId('welcome-google-signin-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('welcome-guest-button')).not.toBeInTheDocument()
  })

  it('shows no pending note once the client has settled (either outcome)', () => {
    renderScreen({}, { status: 'signed-out', configured: true, cloudClientPending: false })
    expect(screen.queryByTestId('welcome-auth-pending')).not.toBeInTheDocument()
  })
})

describe('WelcomeScreen — auth configured, signed out', () => {
  it('offers Sign in with Google and Continue as Guest as distinct choices', () => {
    const props = renderScreen({}, { status: 'signed-out' })
    fireEvent.click(screen.getByTestId('welcome-google-signin-button'))
    fireEvent.click(screen.getByTestId('welcome-guest-button'))
    expect(props.onContinue).toHaveBeenCalledTimes(1)
  })

  it('signing in calls signInWithGoogle, not onContinue directly (a real OAuth redirect follows)', () => {
    const onSignIn = vi.fn(async () => {})
    renderScreen({}, { status: 'signed-out', signInWithGoogle: onSignIn })
    fireEvent.click(screen.getByTestId('welcome-google-signin-button'))
    expect(onSignIn).toHaveBeenCalledTimes(1)
  })

  it('shows the Guest label but no config notice (Supabase is configured)', () => {
    renderScreen({}, { status: 'signed-out' })
    expect(screen.getByTestId('welcome-guest-label')).toBeInTheDocument()
    expect(screen.queryByTestId('welcome-auth-not-configured')).not.toBeInTheDocument()
  })

  // Playtest fix pass (issue 1B) — the two buttons used to be visually
  // distinct but behaviorally identical (both just called onContinue).
  it('Continue as Guest explicitly sets the guest flag; Continue Journey never does', () => {
    const continueAsGuest = vi.fn()
    const props = renderScreen({}, { status: 'signed-out', continueAsGuest })

    fireEvent.click(screen.getByTestId('welcome-continue-button'))
    expect(continueAsGuest).not.toHaveBeenCalled()

    fireEvent.click(screen.getByTestId('welcome-guest-button'))
    expect(continueAsGuest).toHaveBeenCalledTimes(1)
    expect(props.onContinue).toHaveBeenCalledTimes(2)
  })

  // Playtest fix pass (issue 1A) — Google's managed OAuth broker only
  // exists on Lovable's hosted infra; on localhost/Vite dev,
  // AuthProvider.signInWithGoogle detects this itself and sets authError
  // to he.authGoogleLocalDevMessage instead of navigating. This confirms
  // the resulting notice offers all three required follow-ups.
  describe('the local-dev Google-sign-in notice (H1 fix)', () => {
    function renderWithLocalDevError() {
      const continueAsGuest = vi.fn()
      const props = renderScreen(
        {},
        { status: 'signed-out', authError: he.authGoogleLocalDevMessage, continueAsGuest },
      )
      return { ...props, continueAsGuest }
    }

    it('shows the explanation plus Guest, Email, and a dismiss action — never a raw 404', () => {
      renderWithLocalDevError()
      const notice = screen.getByTestId('welcome-google-local-dev-notice')
      expect(notice).toHaveTextContent(he.authGoogleLocalDevMessage)
      expect(screen.getByTestId('welcome-local-dev-guest-button')).toBeInTheDocument()
      expect(screen.getByTestId('welcome-local-dev-email-button')).toBeInTheDocument()
      expect(screen.getByTestId('welcome-local-dev-dismiss-button')).toBeInTheDocument()
    })

    it('its Guest button continues as guest, same as the primary Guest choice', () => {
      const props = renderWithLocalDevError()
      fireEvent.click(screen.getByTestId('welcome-local-dev-guest-button'))
      expect(props.continueAsGuest).toHaveBeenCalledTimes(1)
      expect(props.onContinue).toHaveBeenCalledTimes(1)
    })

    it('its Email button reveals the email sign-in form', () => {
      renderWithLocalDevError()
      expect(screen.queryByTestId('email-password-form')).not.toBeInTheDocument()
      fireEvent.click(screen.getByTestId('welcome-local-dev-email-button'))
      expect(screen.getByTestId('email-password-form')).toBeInTheDocument()
    })

    it('its dismiss action returns to the plain Welcome Screen choices', () => {
      renderWithLocalDevError()
      fireEvent.click(screen.getByTestId('welcome-local-dev-dismiss-button'))
      expect(screen.queryByTestId('welcome-google-local-dev-notice')).not.toBeInTheDocument()
      // The ordinary signed-out choices are still right there underneath.
      expect(screen.getByTestId('welcome-guest-button')).toBeInTheDocument()
      expect(screen.getByTestId('welcome-google-signin-button')).toBeInTheDocument()
    })

    it('clicking Google again after dismissing brings the notice back', () => {
      renderWithLocalDevError()
      fireEvent.click(screen.getByTestId('welcome-local-dev-dismiss-button'))
      expect(screen.queryByTestId('welcome-google-local-dev-notice')).not.toBeInTheDocument()

      fireEvent.click(screen.getByTestId('welcome-google-signin-button'))
      expect(screen.getByTestId('welcome-google-local-dev-notice')).toBeInTheDocument()
    })
  })
})

describe('WelcomeScreen — returning local player (a save/profile exists, no Cloud account)', () => {
  it('shows the more specific "returning local player" label instead of the generic Guest one', () => {
    renderScreen({ hasProfile: true, playerName: 'נועה' }, { status: 'signed-out' })
    expect(screen.getByTestId('welcome-guest-label')).toHaveTextContent(he.welcomeReturningLocalLabel)
    expect(screen.getByTestId('welcome-guest-label')).not.toHaveTextContent(he.welcomeNoAccountYet)
  })

  it('still shows the generic Guest label when there is no local profile yet', () => {
    renderScreen({ hasProfile: false }, { status: 'signed-out' })
    expect(screen.getByTestId('welcome-guest-label')).toHaveTextContent(he.welcomeNoAccountYet)
  })
})

describe('WelcomeScreen — auth configured, signed in', () => {
  it('shows the account identity and a working Sign out action, distinct from the local profile chip', () => {
    const onSignOut = vi.fn(async () => {})
    renderScreen(
      { hasProfile: true, playerName: 'נועה', playerAvatarId: 'azure' },
      {
        status: 'signed-in',
        signOut: onSignOut,
        user: { id: 'u1', email: 'student@example.com', avatarUrl: null, displayName: 'תלמיד לדוגמה' },
      },
    )

    expect(screen.getByTestId('welcome-account-chip')).toHaveTextContent('תלמיד לדוגמה')
    expect(screen.getByTestId('welcome-profile-chip')).toHaveTextContent('נועה')
    expect(screen.getByTestId('welcome-account-chip')).not.toHaveTextContent('נועה')

    fireEvent.click(screen.getByTestId('welcome-sign-out-button'))
    expect(onSignOut).toHaveBeenCalledTimes(1)
  })

  it('does not show the signed-out choice buttons', () => {
    renderScreen({}, { status: 'signed-in' })
    expect(screen.queryByTestId('welcome-google-signin-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('welcome-guest-button')).not.toBeInTheDocument()
  })

  it('does not show the Guest label once actually signed in', () => {
    renderScreen({}, { status: 'signed-in' })
    expect(screen.queryByTestId('welcome-guest-label')).not.toBeInTheDocument()
  })
})

describe('WelcomeScreen — settings popover', () => {
  it('is closed by default, and opens on click', () => {
    renderScreen()
    expect(screen.queryByTestId('welcome-settings-panel')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('welcome-settings-button'))
    expect(screen.getByTestId('welcome-settings-panel')).toBeInTheDocument()
  })

  it('toggles mute via the real onToggleMuted callback', () => {
    const props = renderScreen({ isMuted: false })
    fireEvent.click(screen.getByTestId('welcome-settings-button'))
    fireEvent.click(screen.getByTestId('welcome-mute-toggle-button'))
    expect(props.onToggleMuted).toHaveBeenCalledTimes(1)
  })

  it('requests a New Game, then confirming calls onConfirmNewGame', () => {
    const onRequest = vi.fn()
    const props = baseProps()
    const { rerender } = render(<WelcomeScreen {...props} onRequestNewGame={onRequest} />)
    fireEvent.click(screen.getByTestId('welcome-settings-button'))
    fireEvent.click(screen.getByTestId('welcome-new-game-button'))
    expect(onRequest).toHaveBeenCalledTimes(1)

    const onConfirm = vi.fn()
    rerender(<WelcomeScreen {...props} confirmingNewGame onConfirmNewGame={onConfirm} />)
    fireEvent.click(screen.getByTestId('welcome-confirm-reset-yes-button'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('closes on Escape', () => {
    renderScreen()
    fireEvent.click(screen.getByTestId('welcome-settings-button'))
    expect(screen.getByTestId('welcome-settings-panel')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('welcome-settings-panel')).not.toBeInTheDocument()
  })
})
