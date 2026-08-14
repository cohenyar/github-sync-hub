// @vitest-environment jsdom
import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderGameApp } from '../test/renderGameApp'

// Under Vitest's fireEvent.click (unlike a real browser click), MouseEvent's
// detail is 0 — the same signal GameControlBar/SettingsMenu already treats
// as "keyboard-sourced" (see blurOnPointerActivation) — so the settings
// popover never auto-closes here once opened. Checking first, rather than
// unconditionally clicking the trigger, keeps this correct regardless of
// whether an earlier action already opened it.
function ensureSettingsMenuOpen() {
  if (!screen.queryByRole('menu')) {
    fireEvent.click(screen.getByTestId('settings-menu-button'))
  }
}

// SQL-removal pass — every real mission is now a question mission with no
// async database step, so there's no "wait for Run to become enabled" step
// left; only the World Scene -> classic dashboard switch (unchanged, since
// the World Scene is still the default view) is still needed.
function switchToClassicDashboard() {
  if (screen.queryByTestId('world-scene-3d')) {
    ensureSettingsMenuOpen()
    fireEvent.click(screen.getByTestId('toggle-world-scene-button'))
  }
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Save confirmation', () => {
  it('shows "Saved." after clicking Save, then hides it again after a few seconds', () => {
    renderGameApp()
    switchToClassicDashboard()

    expect(screen.queryByTestId('saved-confirmation')).not.toBeInTheDocument()

    ensureSettingsMenuOpen()
    fireEvent.click(screen.getByTestId('save-button'))
    expect(screen.getByTestId('saved-confirmation')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(screen.queryByTestId('saved-confirmation')).not.toBeInTheDocument()
  })
})
