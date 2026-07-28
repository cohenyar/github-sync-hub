// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import GameApp from '../GameApp'
import { defaultCampaign } from '../campaign'
import { he } from '../i18n'
import { firstContactMission, missionRegistry } from '../missions'
import { hasCompletedOnboarding, markOnboardingComplete } from '../onboarding'
import { saveCurrentGame } from '../persistence'
import { createInitialPlayerProgress, recordMissionCompletion } from '../progression'
import { applyEffect, createWorldState, initialDistricts } from '../worldState'

vi.mock('../db/database', async () => {
  const { createTestDatabase } = await import('../verifier/testDb')
  return { createDatabase: createTestDatabase }
})

// Matches the private key used inside persistence/services/gameSaveService.ts.
const SAVE_KEY = 'meridian:save'
const ONE_MISSION_PERCENTAGE = Math.round(100 / missionRegistry.length)

async function readyRunButton() {
  // The World Scene (not the classic dashboard) is now the default view —
  // switch to the classic dashboard first if we're not there already.
  if (screen.queryByTestId('world-scene-3d')) {
    fireEvent.click(screen.getByTestId('toggle-world-scene-button'))
  }
  const runButton = await screen.findByRole('button', { name: he.run })
  await waitFor(() => expect(runButton).toBeEnabled())
  return runButton
}

// The raw world-state JSON is a collapsed debug view (Sprint 1 polish) —
// expand it before asserting on its contents.
function openDebugView() {
  fireEvent.click(screen.getByRole('button', { name: he.showRawWorldState }))
}

// New Game requires an explicit confirmation step (Sprint 2 polish).
// Selected by stable data-testid (the control bar's action labels are
// Hebrew and free to change; the testids are the durable contract).
function newGame() {
  fireEvent.click(screen.getByTestId('new-game-button'))
  fireEvent.click(screen.getByTestId('confirm-reset-yes-button'))
}

function completedFirstContactSave() {
  const world = applyEffect(createWorldState(initialDistricts), firstContactMission.successEffect!)
  const playerProgress = recordMissionCompletion(
    createInitialPlayerProgress(defaultCampaign),
    'first-contact',
    defaultCampaign,
  )
  return { world, playerProgress }
}

beforeEach(() => {
  window.localStorage.clear()
  // This file's own boot/new-game tests need a fully-clean localStorage
  // (no leftover save from a prior test) — but that also wipes the global
  // setup's onboarding flag, so re-seed it here.
  markOnboardingComplete()
})

describe('Load-on-boot', () => {
  it('boots into a fresh game when no save exists', async () => {
    render(<GameApp />)
    await readyRunButton()

    expect(screen.getByText(`${he.progressLabelPrefix}0%`)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`${he.nextLabelPrefix}קשרי מחוז \\(${he.locked}\\)`))).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('שאילתה חדשה ממתינה. אני מקשיב.')).toBeInTheDocument())
  })

  it('boots straight into a previously saved game', async () => {
    const { world, playerProgress } = completedFirstContactSave()
    saveCurrentGame(world, playerProgress)

    render(<GameApp />)
    await readyRunButton()
    openDebugView()

    expect(screen.getByText(`${he.progressLabelPrefix}${ONE_MISSION_PERCENTAGE}%`)).toBeInTheDocument()
    expect(screen.getByText(/"signal": 100/)).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(`${he.nextLabelPrefix}קשרי מחוז \\(${he.available}\\)`)),
    ).toBeInTheDocument()
  })

  it('does not spuriously re-narrate content that was already unlocked in the save', async () => {
    const { world, playerProgress } = completedFirstContactSave()
    saveCurrentGame(world, playerProgress)

    render(<GameApp />)
    await readyRunButton()

    // First Contact is already completed per the save, so booting into it is
    // a revisit, not a fresh start (Step 1, v0.2) — Odin has nothing new to
    // narrate, including no "mission started" greeting for a mission that
    // isn't actually starting.
    expect(screen.getByText(he.odinIdleMessage)).toBeInTheDocument()
    expect(screen.queryByText(/להתחקות אחר קשרי המחוז/)).not.toBeInTheDocument()
    expect(screen.queryByRole('list', { name: he.odinHistoryAriaLabel })).not.toBeInTheDocument()
  })

  it('falls back to a fresh game when the saved data is corrupted, without crashing', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    window.localStorage.setItem(SAVE_KEY, 'not valid json{')

    render(<GameApp />)
    await readyRunButton()

    expect(screen.getByText(`${he.progressLabelPrefix}0%`)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`${he.nextLabelPrefix}קשרי מחוז \\(${he.locked}\\)`))).toBeInTheDocument()
    expect(errorSpy).not.toHaveBeenCalled()

    errorSpy.mockRestore()
  })
})

describe('New Game reset', () => {
  it('clears the save and resets world and progress', async () => {
    render(<GameApp />)
    const runButton = await readyRunButton()
    openDebugView()

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)
    await screen.findByText(he.pass)
    await waitFor(() => expect(screen.getByText(`${he.progressLabelPrefix}${ONE_MISSION_PERCENTAGE}%`)).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('save-button'))
    newGame()

    await waitFor(() => expect(screen.getByText(`${he.progressLabelPrefix}0%`)).toBeInTheDocument())
    expect(screen.getByText(new RegExp(`${he.nextLabelPrefix}קשרי מחוז \\(${he.locked}\\)`))).toBeInTheDocument()
    expect(screen.queryByText(/"signal": 100/)).not.toBeInTheDocument()

    // The save was cleared too, so a later boot won't resurrect the old game.
    expect(window.localStorage.getItem(SAVE_KEY)).toBeNull()

    // Onboarding: New Game also clears the "has onboarded" flag, so the
    // boot sequence returns on the next fresh entry — but not within this
    // same mounted session (see GameApp.tsx's handleConfirmNewGame).
    expect(hasCompletedOnboarding()).toBe(false)
    expect(screen.queryByTestId('boot-sequence')).not.toBeInTheDocument()
  })

  it('does not spuriously re-narrate once the reset progress is re-evaluated against the reset baseline', async () => {
    render(<GameApp />)
    const runButton = await readyRunButton()

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)
    await screen.findByText(he.pass)
    await waitFor(() =>
      expect(
        screen.getByText('העיר מתחילה להשיב. אפשר כעת להתחקות אחר קשרי המחוז.'),
      ).toBeInTheDocument(),
    )

    newGame()
    await waitFor(() => expect(screen.getByText(`${he.progressLabelPrefix}0%`)).toBeInTheDocument())

    // The unlock re-check effect re-runs against the reset (empty) progress;
    // it must not treat anything as newly unlocked and add a second
    // District Ties narration on top of the one already in history.
    expect(
      screen.getByText('העיר מתחילה להשיב. אפשר כעת להתחקות אחר קשרי המחוז.'),
    ).toBeInTheDocument()
  })

  it('keeps the app stable with no console errors across a full New Game cycle', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<GameApp />)
    const runButton = await readyRunButton()

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)
    await screen.findByText(he.pass)

    fireEvent.click(screen.getByTestId('save-button'))
    newGame()
    await waitFor(() => expect(screen.getByText(`${he.progressLabelPrefix}0%`)).toBeInTheDocument())

    expect(errorSpy).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('does nothing until the reset is confirmed, and Cancel dismisses the prompt without resetting', async () => {
    render(<GameApp />)
    const runButton = await readyRunButton()

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)
    await screen.findByText(he.pass)
    await waitFor(() => expect(screen.getByText(`${he.progressLabelPrefix}${ONE_MISSION_PERCENTAGE}%`)).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('new-game-button'))
    expect(screen.getByTestId('reset-confirm-prompt')).toBeInTheDocument()
    // Progress is untouched while the confirmation is pending.
    expect(screen.getByText(`${he.progressLabelPrefix}${ONE_MISSION_PERCENTAGE}%`)).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('confirm-reset-cancel-button'))
    expect(screen.queryByTestId('reset-confirm-prompt')).not.toBeInTheDocument()
    expect(screen.getByText(`${he.progressLabelPrefix}${ONE_MISSION_PERCENTAGE}%`)).toBeInTheDocument()
  })
})
