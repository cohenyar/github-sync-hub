// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../auth'
import type { AuthContextValue } from '../auth'
import { he } from '../i18n'
import type { ExplorerRank } from '../progression'
import { GameControlBar } from './GameControlBar'

const DEFAULT_EXPLORER_RANK: ExplorerRank = { completions: 0, totalContent: 8, tier: 'newcomer' }

function renderBar(overrides: Partial<Parameters<typeof GameControlBar>[0]> = {}) {
  const props = {
    explorerRank: DEFAULT_EXPLORER_RANK,
    archivePageCount: 0,
    onToggleArchivePages: vi.fn(),
    justSaved: false,
    confirmingNewGame: false,
    showWorldScene: false,
    isMuted: false,
    onSave: vi.fn(),
    onLoad: vi.fn(),
    onRequestNewGame: vi.fn(),
    onConfirmNewGame: vi.fn(),
    onCancelNewGame: vi.fn(),
    onToggleWorldScene: vi.fn(),
    onToggleMuted: vi.fn(),
    onEditProfile: vi.fn(),
    onSelectDifficulty: vi.fn(),
    ...overrides,
  }
  render(<GameControlBar {...props} />)
  return props
}

function openSettingsMenu() {
  fireEvent.click(screen.getByTestId('settings-menu-button'))
}

describe('GameControlBar — Bug A fix (stray focus double-fire on Enter)', () => {
  it('blurs a button after a mouse-sourced click, so it cannot later re-activate on an unrelated Enter press', () => {
    const props = renderBar()
    openSettingsMenu()
    const saveButton = screen.getByTestId('save-button')

    saveButton.focus()
    expect(document.activeElement).toBe(saveButton)

    fireEvent.click(saveButton, { detail: 1 })

    expect(props.onSave).toHaveBeenCalledTimes(1)
    expect(document.activeElement).not.toBe(saveButton)
  })

  it('does not blur a button after a keyboard-sourced activation, preserving normal Tab+Enter/Space operation', () => {
    const props = renderBar()
    openSettingsMenu()
    const saveButton = screen.getByTestId('save-button')

    saveButton.focus()
    expect(document.activeElement).toBe(saveButton)

    // Browsers report detail: 0 for a click synthesized by Enter/Space on a
    // focused button, as opposed to a real pointer click.
    fireEvent.click(saveButton, { detail: 0 })

    expect(props.onSave).toHaveBeenCalledTimes(1)
    expect(document.activeElement).toBe(saveButton)
  })

  it('applies the same pointer-only blur behavior to every control-bar button', () => {
    const props = renderBar()
    openSettingsMenu()
    const worldToggle = screen.getByTestId('toggle-world-scene-button')

    worldToggle.focus()
    fireEvent.click(worldToggle, { detail: 1 })

    expect(props.onToggleWorldScene).toHaveBeenCalledTimes(1)
    expect(document.activeElement).not.toBe(worldToggle)
  })
})

describe('GameControlBar — "Saved." confirmation survives the settings menu closing', () => {
  it('shows the confirmation even while the settings menu is closed', () => {
    renderBar({ justSaved: true })
    expect(screen.getByTestId('saved-confirmation')).toBeInTheDocument()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('keeps showing the confirmation after Save closes the popover it was clicked from', () => {
    const props = {
      explorerRank: DEFAULT_EXPLORER_RANK,
      archivePageCount: 0,
      onToggleArchivePages: vi.fn(),
      justSaved: false,
      confirmingNewGame: false,
      showWorldScene: false,
      isMuted: false,
      onSave: vi.fn(),
      onLoad: vi.fn(),
      onRequestNewGame: vi.fn(),
      onConfirmNewGame: vi.fn(),
      onCancelNewGame: vi.fn(),
      onToggleWorldScene: vi.fn(),
      onToggleMuted: vi.fn(),
      onEditProfile: vi.fn(),
      onSelectDifficulty: vi.fn(),
    }
    const { rerender } = render(<GameControlBar {...props} />)
    openSettingsMenu()
    // detail: 1 marks this as a genuine pointer click — see SettingsMenu's
    // runAndClose, which only closes the popover on a real pointer click
    // (mirroring the existing blurOnPointerActivation convention), not on a
    // plain fireEvent.click (detail: 0).
    fireEvent.click(screen.getByTestId('save-button'), { detail: 1 })
    expect(props.onSave).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    // GameApp would now set justSaved to true in response to onSave.
    rerender(<GameControlBar {...props} justSaved />)
    expect(screen.getByTestId('saved-confirmation')).toBeInTheDocument()
  })
})

describe('GameControlBar — Explorer Rank (Meridian 1.3)', () => {
  it('shows the rank badge always, never behind the settings menu', () => {
    renderBar({ explorerRank: { completions: 3, totalContent: 8, tier: 'helper' } })
    const badge = screen.getByTestId('explorer-rank-badge')
    expect(badge).toHaveTextContent('3/8')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('reflects a higher tier once completions cross its threshold', () => {
    renderBar({ explorerRank: { completions: 7, totalContent: 8, tier: 'guardian' } })
    expect(screen.getByTestId('explorer-rank-badge')).toHaveTextContent('7/8')
  })
})

describe('GameControlBar — Admin toggle removed (Auth Phase 1)', () => {
  it('no longer renders an in-game admin toggle; Admin is now a protected /admin route', () => {
    renderBar()
    expect(screen.queryByTestId('admin-toggle-button')).not.toBeInTheDocument()
  })
})

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

function renderBarWithAuth(authValue: AuthContextValue) {
  const props = {
    explorerRank: DEFAULT_EXPLORER_RANK,
    archivePageCount: 0,
    onToggleArchivePages: vi.fn(),
    justSaved: false,
    confirmingNewGame: false,
    showWorldScene: false,
    isMuted: false,
    onSave: vi.fn(),
    onLoad: vi.fn(),
    onRequestNewGame: vi.fn(),
    onConfirmNewGame: vi.fn(),
    onCancelNewGame: vi.fn(),
    onToggleWorldScene: vi.fn(),
    onToggleMuted: vi.fn(),
    onEditProfile: vi.fn(),
    onSelectDifficulty: vi.fn(),
  }
  render(
    <AuthContext.Provider value={authValue}>
      <GameControlBar {...props} />
    </AuthContext.Provider>,
  )
  return props
}

describe('GameControlBar — persistent auth control (main-flow auth access)', () => {
  it('renders nothing extra when there is no AuthProvider ancestor at all (e.g. most existing tests render <GameApp/> directly)', () => {
    // No AuthContext.Provider wrapper here — renderBar() is the plain helper.
    renderBar()
    expect(screen.queryByTestId('google-sign-in-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('sign-out-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('auth-account')).not.toBeInTheDocument()
  })

  it('shows a single "Sign in with Google" action for a signed-out guest', () => {
    renderBarWithAuth({ ...BASE_AUTH, status: 'signed-out' })
    expect(screen.getAllByTestId('google-sign-in-button')).toHaveLength(1)
    expect(screen.queryByTestId('sign-out-button')).not.toBeInTheDocument()
  })

  it('shows the account name and a single "Sign out" action for a signed-in player', () => {
    renderBarWithAuth({
      ...BASE_AUTH,
      status: 'signed-in',
      user: { id: 'u1', email: 'student@example.com', avatarUrl: null, displayName: null },
      role: 'student',
    })
    expect(screen.getByTestId('auth-account')).toHaveTextContent('student@example.com')
    fireEvent.click(screen.getByTestId('auth-account'))
    expect(screen.getAllByTestId('sign-out-button')).toHaveLength(1)
    expect(screen.queryByTestId('google-sign-in-button')).not.toBeInTheDocument()
  })

  it('signing out calls the shared AuthProvider signOut — logout never redesigns or duplicates the control', () => {
    const signOut = vi.fn(async () => {})
    renderBarWithAuth({
      ...BASE_AUTH,
      status: 'signed-in',
      user: { id: 'u1', email: 'student@example.com', avatarUrl: null, displayName: null },
      role: 'student',
      signOut,
    })

    fireEvent.click(screen.getByTestId('auth-account'))
    fireEvent.click(screen.getByTestId('sign-out-button'))
    expect(signOut).toHaveBeenCalledTimes(1)
  })

  it('does not show the auth control at all when Supabase is not configured, leaving guest play unaffected', () => {
    renderBarWithAuth({ ...BASE_AUTH, configured: false })
    expect(screen.queryByTestId('google-sign-in-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('auth-account')).not.toBeInTheDocument()
    // The rest of the control bar is completely unaffected.
    openSettingsMenu()
    expect(screen.getByRole('button', { name: he.save })).toBeInTheDocument()
  })
})
