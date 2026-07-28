// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../auth'
import type { AuthContextValue } from '../auth'
import { he } from '../i18n'
import { GameControlBar } from './GameControlBar'

function renderBar(overrides: Partial<Parameters<typeof GameControlBar>[0]> = {}) {
  const props = {
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
    ...overrides,
  }
  render(<GameControlBar {...props} />)
  return props
}

describe('GameControlBar — Bug A fix (stray focus double-fire on Enter)', () => {
  it('blurs a button after a mouse-sourced click, so it cannot later re-activate on an unrelated Enter press', () => {
    const props = renderBar()
    const saveButton = screen.getByTestId('save-button')

    saveButton.focus()
    expect(document.activeElement).toBe(saveButton)

    fireEvent.click(saveButton, { detail: 1 })

    expect(props.onSave).toHaveBeenCalledTimes(1)
    expect(document.activeElement).not.toBe(saveButton)
  })

  it('does not blur a button after a keyboard-sourced activation, preserving normal Tab+Enter/Space operation', () => {
    const props = renderBar()
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
    const worldToggle = screen.getByTestId('toggle-world-scene-button')

    worldToggle.focus()
    fireEvent.click(worldToggle, { detail: 1 })

    expect(props.onToggleWorldScene).toHaveBeenCalledTimes(1)
    expect(document.activeElement).not.toBe(worldToggle)
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
  signInWithGoogle: vi.fn(async () => {}),
  signOut: vi.fn(async () => {}),
}

function renderBarWithAuth(authValue: AuthContextValue) {
  const props = {
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

  it('shows the account email and a single "Sign out" action for a signed-in player', () => {
    renderBarWithAuth({
      ...BASE_AUTH,
      status: 'signed-in',
      user: { id: 'u1', email: 'student@example.com', avatarUrl: null },
      role: 'student',
    })
    expect(screen.getByTestId('auth-account')).toHaveTextContent('student@example.com')
    expect(screen.getAllByTestId('sign-out-button')).toHaveLength(1)
    expect(screen.queryByTestId('google-sign-in-button')).not.toBeInTheDocument()
  })

  it('signing out calls the shared AuthProvider signOut — logout never redesigns or duplicates the control', () => {
    const signOut = vi.fn(async () => {})
    renderBarWithAuth({
      ...BASE_AUTH,
      status: 'signed-in',
      user: { id: 'u1', email: 'student@example.com', avatarUrl: null },
      role: 'student',
      signOut,
    })

    fireEvent.click(screen.getByTestId('sign-out-button'))
    expect(signOut).toHaveBeenCalledTimes(1)
  })

  it('does not show the auth control at all when Supabase is not configured, leaving guest play unaffected', () => {
    renderBarWithAuth({ ...BASE_AUTH, configured: false })
    expect(screen.queryByTestId('google-sign-in-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('auth-account')).not.toBeInTheDocument()
    // The rest of the control bar is completely unaffected.
    expect(screen.getByRole('button', { name: he.save })).toBeInTheDocument()
  })
})
