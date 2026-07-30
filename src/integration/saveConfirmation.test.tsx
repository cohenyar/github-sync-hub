// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GameApp from '../GameApp'
import { he } from '../i18n'

vi.mock('../db/database', async () => {
  const { createTestDatabase } = await import('../verifier/testDb')
  return { createDatabase: createTestDatabase }
})

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

async function readyRunButton() {
  // The World Scene (not the classic dashboard) is now the default view —
  // switch to the classic dashboard first if we're not there already.
  if (screen.queryByTestId('world-scene-3d')) {
    ensureSettingsMenuOpen()
    fireEvent.click(screen.getByTestId('toggle-world-scene-button'))
  }
  const runButton = await screen.findByRole('button', { name: he.run })
  await waitFor(() => expect(runButton).toBeEnabled())
  return runButton
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Save confirmation', () => {
  it('shows "Saved." after clicking Save, then hides it again after a few seconds', async () => {
    render(<GameApp />)
    await readyRunButton()

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
