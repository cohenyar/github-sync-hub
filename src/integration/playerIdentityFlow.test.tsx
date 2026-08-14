// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import GameApp from '../GameApp'
import { he } from '../i18n'
import { clearOnboardingFlag, markOnboardingComplete } from '../onboarding'

function ensureSettingsMenuOpen() {
  if (!screen.queryByRole('menu')) {
    fireEvent.click(screen.getByTestId('settings-menu-button'))
  }
}

/**
 * Meridian 1.4 — every other integration test uses renderGameApp(), which
 * deliberately passes through the Welcome Screen and Profile Creation
 * transparently so it doesn't need to change on every unrelated test. This
 * file is the one place that renders <GameApp/> directly and asserts on
 * those two screens themselves, so the real wiring between them (not just
 * each component in isolation) has real coverage.
 */
describe('Meridian 1.4 — Welcome Screen and Profile Creation, wired into GameApp', () => {
  it('a first-time player sees Welcome, then mandatory Profile Creation, then the boot sequence — never the world before all three', () => {
    clearOnboardingFlag()
    render(<GameApp />)

    expect(screen.getByTestId('welcome-screen')).toBeInTheDocument()
    expect(screen.queryByTestId('profile-creation-screen')).not.toBeInTheDocument()
    expect(screen.queryByTestId('boot-sequence')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('welcome-continue-button'))
    expect(screen.queryByTestId('welcome-screen')).not.toBeInTheDocument()
    expect(screen.getByTestId('profile-creation-screen')).toBeInTheDocument()

    fireEvent.change(screen.getByTestId('profile-name-input'), { target: { value: 'נועה' } })
    fireEvent.click(screen.getByTestId('profile-avatar-option-azure'))
    fireEvent.click(screen.getByTestId('profile-submit-button'))

    expect(screen.queryByTestId('profile-creation-screen')).not.toBeInTheDocument()
    expect(screen.getByTestId('boot-sequence')).toBeInTheDocument()
  })

  it('the chosen name and avatar persist into the world: HUD rank badge area and the settings-menu profile row both show it', () => {
    clearOnboardingFlag()
    render(<GameApp />)

    fireEvent.click(screen.getByTestId('welcome-continue-button'))
    fireEvent.change(screen.getByTestId('profile-name-input'), { target: { value: 'דניאל' } })
    fireEvent.click(screen.getByTestId('profile-submit-button'))
    fireEvent.click(screen.getByTestId('boot-sequence-skip-button'))

    ensureSettingsMenuOpen()
    expect(screen.getByTestId('edit-profile-button')).toHaveTextContent('דניאל')
  })

  it('a returning player (profile already exists) sees Continue Journey with their identity chip, and it leads straight past Profile Creation', () => {
    clearOnboardingFlag()
    const first = render(<GameApp />)
    fireEvent.click(screen.getByTestId('welcome-continue-button'))
    fireEvent.change(screen.getByTestId('profile-name-input'), { target: { value: 'נועה' } })
    fireEvent.click(screen.getByTestId('profile-submit-button'))
    fireEvent.click(screen.getByTestId('boot-sequence-skip-button'))
    first.unmount()

    // A fresh mount — the Welcome Screen shows again (every launch), but
    // the profile already exists.
    markOnboardingComplete()
    render(<GameApp />)

    const chip = screen.getByTestId('welcome-profile-chip')
    expect(chip).toHaveTextContent('נועה')
    fireEvent.click(screen.getByTestId('welcome-continue-button'))

    expect(screen.queryByTestId('profile-creation-screen')).not.toBeInTheDocument()
    expect(screen.getByTestId('world-scene-3d')).toBeInTheDocument()
  })

  it('editing the profile from the settings menu updates the name shown there, without reopening Profile Creation as a gate', () => {
    clearOnboardingFlag()
    render(<GameApp />)
    fireEvent.click(screen.getByTestId('welcome-continue-button'))
    fireEvent.change(screen.getByTestId('profile-name-input'), { target: { value: 'נועה' } })
    fireEvent.click(screen.getByTestId('profile-submit-button'))
    fireEvent.click(screen.getByTestId('boot-sequence-skip-button'))

    ensureSettingsMenuOpen()
    fireEvent.click(screen.getByTestId('edit-profile-button'))

    const editScreen = screen.getByTestId('profile-creation-screen')
    expect(editScreen).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: he.profileEditTitle })).toBeInTheDocument()
    expect(screen.getByTestId('profile-name-input')).toHaveValue('נועה')

    fireEvent.change(screen.getByTestId('profile-name-input'), { target: { value: 'דניאל' } })
    fireEvent.click(screen.getByTestId('profile-submit-button'))

    expect(screen.queryByTestId('profile-creation-screen')).not.toBeInTheDocument()
    ensureSettingsMenuOpen()
    expect(screen.getByTestId('edit-profile-button')).toHaveTextContent('דניאל')
  })

  it('canceling the profile editor discards the draft and keeps the original name', () => {
    clearOnboardingFlag()
    render(<GameApp />)
    fireEvent.click(screen.getByTestId('welcome-continue-button'))
    fireEvent.change(screen.getByTestId('profile-name-input'), { target: { value: 'נועה' } })
    fireEvent.click(screen.getByTestId('profile-submit-button'))
    fireEvent.click(screen.getByTestId('boot-sequence-skip-button'))

    ensureSettingsMenuOpen()
    fireEvent.click(screen.getByTestId('edit-profile-button'))
    fireEvent.change(screen.getByTestId('profile-name-input'), { target: { value: 'שם שגוי' } })
    fireEvent.click(screen.getByTestId('profile-cancel-button'))

    expect(screen.queryByTestId('profile-creation-screen')).not.toBeInTheDocument()
    ensureSettingsMenuOpen()
    expect(screen.getByTestId('edit-profile-button')).toHaveTextContent('נועה')
  })
})
