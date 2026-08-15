// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { he } from '../i18n'
import { missionRegistry } from '../missions'
import { markOnboardingComplete } from '../onboarding'
import { renderGameApp, submitMultipleChoiceAnswer } from '../test/renderGameApp'

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

// SQL-removal pass — every real mission is now a question mission with no
// async database step, so there's no "wait for Run to become enabled" step
// left; only the World Scene -> classic dashboard switch (unchanged) is
// still needed before the question panel is on screen.
function switchToClassicDashboard() {
  // The World Scene (not the classic dashboard) is now the default view —
  // switch to the classic dashboard first if we're not there already.
  if (screen.queryByTestId('world-scene-3d')) {
    ensureSettingsMenuOpen()
    fireEvent.click(screen.getByTestId('toggle-world-scene-button'))
  }
}

// The raw world-state JSON is a collapsed debug view (Sprint 1 polish) —
// expand it before asserting on its contents.
function openDebugView() {
  fireEvent.click(screen.getByRole('button', { name: he.showRawWorldState }))
}

beforeEach(() => {
  window.localStorage.clear()
  // This file's own save/load isolation needs a fully-clean localStorage
  // (no leftover save from a prior test) — but that also wipes the global
  // setup's onboarding flag, so re-seed it here.
  markOnboardingComplete()
})

describe('Save/Load restores world and progress across a simulated reload', () => {
  it('persists mission completion and world state, then boots straight into them on the next app instance', async () => {
    const first = renderGameApp()
    switchToClassicDashboard()
    openDebugView()

    // First Contact is now "The First Emperor" (History, multiple choice) —
    // option 0 (אוגוסטוס) is the correct answer (see missions/firstContact.ts).
    submitMultipleChoiceAnswer(0) // אוגוסטוס — the correct answer
    await screen.findByText(he.exerciseCorrectFeedback)

    const expectedPercentage = Math.round(100 / missionRegistry.length)
    await waitFor(() => expect(screen.getByText(/"signal": 100/)).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText(`${he.progressLabelPrefix}${expectedPercentage}%`)).toBeInTheDocument())

    ensureSettingsMenuOpen()
    fireEvent.click(screen.getByTestId('save-button'))
    first.unmount()

    // A brand new App instance starts from the same fresh initial state a
    // real page reload would, except that Step 23's load-on-boot now finds
    // the save and restores it immediately — no Load click needed.
    renderGameApp()
    switchToClassicDashboard()
    openDebugView()

    expect(screen.getByText(`${he.progressLabelPrefix}${expectedPercentage}%`)).toBeInTheDocument()
    expect(screen.getByText(/"signal": 100/)).toBeInTheDocument()
    // The new app instance must resume on the player's real current mission
    // (District Ties, the one after the one just completed) directly — not
    // reopen the already-finished First Contact and require a "Continue"
    // click just to get back to where the player actually was.
    expect(screen.getByRole('heading', { name: 'תרגום: ספרייה' })).toBeInTheDocument()
    // Meridian 2.0 open-world pass — South Stability (Math) is always
    // unlocked from the very start, never gated behind another subject.
    expect(
      screen.getByText(new RegExp(`${he.nextLabelPrefix}כפל: 8 × 7 \\(${he.available}\\)`)),
    ).toBeInTheDocument()
  })

  it('does nothing when Load is clicked with no save present', async () => {
    renderGameApp()
    switchToClassicDashboard()

    expect(screen.getByText(`${he.progressLabelPrefix}0%`)).toBeInTheDocument()
    ensureSettingsMenuOpen()
    fireEvent.click(screen.getByTestId('load-button'))

    expect(screen.getByText(`${he.progressLabelPrefix}0%`)).toBeInTheDocument()
  })
})
