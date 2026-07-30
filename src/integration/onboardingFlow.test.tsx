// @vitest-environment jsdom
import { act, fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearOnboardingFlag, hasCompletedOnboarding, markOnboardingComplete } from '../onboarding'
import { passEntryGates, renderGameApp } from '../test/renderGameApp'

vi.mock('../db/database', async () => {
  const { createTestDatabase } = await import('../verifier/testDb')
  return { createDatabase: createTestDatabase }
})

const LOG_LINE_MS = 1600
const ODIN_LINE_MS = 3200

// Under Vitest's fireEvent.click (unlike a real browser click), MouseEvent's
// detail is 0 — the same signal SettingsMenu already treats as
// "keyboard-sourced" (see blurOnPointerActivation) — so the settings popover
// never auto-closes here once opened. Checking first, rather than
// unconditionally clicking the trigger, keeps this correct regardless of
// whether an earlier action already opened it.
function ensureSettingsMenuOpen() {
  if (!screen.queryByRole('menu')) {
    fireEvent.click(screen.getByTestId('settings-menu-button'))
  }
}

async function advanceOneLine(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

async function advanceThroughAllLines() {
  for (let i = 0; i < 5; i += 1) {
    await advanceOneLine(LOG_LINE_MS)
  }
  await advanceOneLine(ODIN_LINE_MS)
}

beforeEach(() => {
  // Overrides src/test/setup.ts's global default (every other test in this
  // suite wants a returning player) — these tests are specifically about
  // the first-time, not-yet-onboarded path.
  clearOnboardingFlag()
})

describe('Onboarding: first-time player', () => {
  it('shows the boot sequence on first mount, not the World Scene or classic dashboard', () => {
    renderGameApp()

    expect(screen.getByTestId('boot-sequence')).toBeInTheDocument()
    expect(screen.queryByTestId('world-scene-3d')).not.toBeInTheDocument()
    expect(screen.queryByTestId('toggle-world-scene-button')).not.toBeInTheDocument()
  })

  it('Skip reveals the World Scene immediately and marks onboarding complete', () => {
    renderGameApp()

    fireEvent.click(screen.getByTestId('boot-sequence-skip-button'))

    expect(screen.queryByTestId('boot-sequence')).not.toBeInTheDocument()
    expect(screen.getByTestId('world-scene-3d')).toBeInTheDocument()
    expect(hasCompletedOnboarding()).toBe(true)
  })

  it('finishing the sequence naturally (no Skip) reaches the same end state', async () => {
    vi.useFakeTimers()
    renderGameApp()

    await advanceThroughAllLines()

    expect(screen.queryByTestId('boot-sequence')).not.toBeInTheDocument()
    expect(screen.getByTestId('world-scene-3d')).toBeInTheDocument()
    expect(hasCompletedOnboarding()).toBe(true)
    vi.useRealTimers()
  })

  it('greets the player with a one-time Odin narration once the World Scene is reached', () => {
    renderGameApp()
    fireEvent.click(screen.getByTestId('boot-sequence-skip-button'))

    expect(screen.getByTestId('odin-presence')).toHaveTextContent('ברוך הבא למרידיאן')
  })

  it('never replays the world-entry greeting when toggling between the World Scene and classic dashboard afterward', () => {
    renderGameApp()
    fireEvent.click(screen.getByTestId('boot-sequence-skip-button'))
    expect(screen.getByTestId('odin-presence')).toHaveTextContent('ברוך הבא למרידיאן')

    // Toggle back and forth several times — WorldEntered must never publish
    // again, so Odin's narration history never grows past its one entry.
    ensureSettingsMenuOpen()
    fireEvent.click(screen.getByTestId('toggle-world-scene-button'))
    ensureSettingsMenuOpen()
    fireEvent.click(screen.getByTestId('toggle-world-scene-button'))
    ensureSettingsMenuOpen()
    fireEvent.click(screen.getByTestId('toggle-world-scene-button'))

    // The classic dashboard's OdinPanel only renders a "history" list once
    // more than one narration entry exists — its absence here proves the
    // greeting is still the *only* entry Odin has ever narrated.
    expect(screen.getByTestId('odin-latest-message')).toHaveTextContent('ברוך הבא למרידיאן')
    expect(screen.queryByTestId('odin-history')).not.toBeInTheDocument()
  })

  it('does not replay the first-time world-entry greeting after a real unmount/remount (Meridian 1.3: a welcome-back line plays instead)', () => {
    const first = renderGameApp()
    fireEvent.click(screen.getByTestId('boot-sequence-skip-button'))
    expect(hasCompletedOnboarding()).toBe(true)
    first.unmount()

    // A fresh mount now finds the flag already set (this is the returning-
    // player path) and must not show the boot sequence or replay the
    // first-time greeting — but Meridian 1.3 gives a returning player its
    // own one-time welcome-back line (Core Loop §01), so Odin is not silent.
    renderGameApp()
    expect(screen.queryByTestId('boot-sequence')).not.toBeInTheDocument()
    expect(screen.getByTestId('world-scene-3d')).toBeInTheDocument()
    expect(screen.getByTestId('odin-presence')).not.toHaveTextContent('ברוך הבא למרידיאן')
    expect(screen.getByTestId('odin-presence')).toHaveTextContent('ברוך שובך למרידיאן')
  })
})

describe('Onboarding: returning player', () => {
  beforeEach(() => {
    markOnboardingComplete()
  })

  it('never shows the boot sequence; the World Scene is immediately visible', () => {
    renderGameApp()

    expect(screen.queryByTestId('boot-sequence')).not.toBeInTheDocument()
    expect(screen.getByTestId('world-scene-3d')).toBeInTheDocument()
  })

  it('does not narrate the first-time world-entry greeting, but does get a Meridian 1.3 welcome-back line instead', () => {
    renderGameApp()

    expect(screen.getByTestId('odin-presence')).not.toHaveTextContent('ברוך הבא למרידיאן')
    expect(screen.getByTestId('odin-presence')).toHaveTextContent('ברוך שובך למרידיאן')
  })
})

describe('Onboarding: SessionResumed (Meridian 1.3)', () => {
  it('never fires for a first-time player — WorldEntered is their only greeting', () => {
    renderGameApp()
    // The boot sequence owns the screen; skip it to reach the World Scene.
    fireEvent.click(screen.getByTestId('boot-sequence-skip-button'))

    expect(screen.getByTestId('odin-presence')).toHaveTextContent('ברוך הבא למרידיאן')
    expect(screen.getByTestId('odin-presence')).not.toHaveTextContent('ברוך שובך למרידיאן')
  })

  it('fires exactly once per mount for a returning player, not once per render', () => {
    markOnboardingComplete()
    renderGameApp()

    // Switch to the classic dashboard (a re-render, not a remount) to read
    // Odin's full narration history via OdinPanel.
    ensureSettingsMenuOpen()
    fireEvent.click(screen.getByTestId('toggle-world-scene-button'))

    // OdinPanel only renders a "history" list once more than one narration
    // entry exists — its absence here proves the welcome-back line is still
    // the *only* entry Odin has ever narrated, even after re-rendering.
    expect(screen.getByTestId('odin-latest-message')).toHaveTextContent('ברוך שובך למרידיאן')
    expect(screen.queryByTestId('odin-history')).not.toBeInTheDocument()
  })
})

describe('Onboarding: New Game reset', () => {
  it('clears the onboarding flag, but does not reopen the boot sequence within the same mounted session', () => {
    markOnboardingComplete()
    renderGameApp()
    expect(screen.getByTestId('world-scene-3d')).toBeInTheDocument()

    ensureSettingsMenuOpen()
    fireEvent.click(screen.getByTestId('toggle-world-scene-button'))
    ensureSettingsMenuOpen()
    fireEvent.click(screen.getByTestId('new-game-button'))
    fireEvent.click(screen.getByTestId('confirm-reset-yes-button'))
    // The reset also clears the local profile — GameApp's own mandatory
    // Profile Creation gate reappears immediately, ahead of whatever this
    // test checks next.
    passEntryGates()

    expect(hasCompletedOnboarding()).toBe(false)
    expect(screen.queryByTestId('boot-sequence')).not.toBeInTheDocument()
  })
})
