// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultCampaign } from '../campaign'
import { he } from '../i18n'
import { firstContactMission, missionRegistry } from '../missions'
import { hasCompletedOnboarding, markOnboardingComplete } from '../onboarding'
import { saveCurrentGame } from '../persistence'
import { createInitialPlayerProgress, recordMissionCompletion } from '../progression'
import { passEntryGates, renderGameApp } from '../test/renderGameApp'
import { applyEffect, createWorldState, initialDistricts } from '../worldState'

vi.mock('../db/database', async () => {
  const { createTestDatabase } = await import('../verifier/testDb')
  return { createDatabase: createTestDatabase }
})

// Matches the private key used inside persistence/services/gameSaveService.ts.
const SAVE_KEY = 'meridian:save'
const ONE_MISSION_PERCENTAGE = Math.round(100 / missionRegistry.length)

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

// The raw world-state JSON is a collapsed debug view (Sprint 1 polish) —
// expand it before asserting on its contents.
function openDebugView() {
  fireEvent.click(screen.getByRole('button', { name: he.showRawWorldState }))
}

// New Game requires an explicit confirmation step (Sprint 2 polish).
// Selected by stable data-testid (the control bar's action labels are
// Hebrew and free to change; the testids are the durable contract).
function newGame() {
  ensureSettingsMenuOpen()
  fireEvent.click(screen.getByTestId('new-game-button'))
  fireEvent.click(screen.getByTestId('confirm-reset-yes-button'))
  // The reset also clears the local profile — GameApp's own mandatory
  // Profile Creation gate reappears immediately, ahead of whatever the
  // caller checks next.
  passEntryGates()
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
    renderGameApp()
    await readyRunButton()

    expect(screen.getByText(`${he.progressLabelPrefix}0%`)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`${he.nextLabelPrefix}קשרי מחוז \\(${he.locked}\\)`))).toBeInTheDocument()
    // Playtest fix pass (issue 6B) — mission-started now interpolates the
    // actual mission's own title (First Contact, on a fresh game).
    await waitFor(() => expect(screen.getByText('משימה חדשה מתחילה: מגע ראשון. אני מקשיב.')).toBeInTheDocument())
  })

  it('boots straight into a previously saved game, resuming on the actual current mission', async () => {
    const { world, playerProgress } = completedFirstContactSave()
    saveCurrentGame(world, playerProgress)

    renderGameApp()
    await readyRunButton()
    openDebugView()

    expect(screen.getByText(`${he.progressLabelPrefix}${ONE_MISSION_PERCENTAGE}%`)).toBeInTheDocument()
    expect(screen.getByText(/"signal": 100/)).toBeInTheDocument()
    // Regression guard: the console must load the player's real frontier
    // (District Ties, the mission after the one just completed) directly —
    // not re-open the already-finished First Contact and make the player
    // click "Continue" to get anywhere.
    expect(screen.getByRole('heading', { name: 'קשרי מחוז' })).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(`${he.nextLabelPrefix}יציבות הדרום \\(${he.locked}\\)`)),
    ).toBeInTheDocument()
  })

  it('resumes on the true current mission after multiple completions, not the first-ever mission', async () => {
    // Regression guard: before the fix, activeMissionId's initial state
    // always defaulted to the first-ever-registered mission ("First
    // Contact") regardless of saved progress. A player who had already
    // finished two missions would boot back into a mission they'd long
    // completed instead of their real frontier, forcing them to click
    // "Continue" through already-finished content one mission at a time
    // before reaching anything new — read by the player as "the next
    // challenge stays locked."
    let progress = createInitialPlayerProgress(defaultCampaign)
    progress = recordMissionCompletion(progress, 'first-contact', defaultCampaign)
    progress = recordMissionCompletion(progress, 'district-ties', defaultCampaign)
    saveCurrentGame(createWorldState(initialDistricts), progress)

    renderGameApp()
    await readyRunButton()

    expect(screen.getByRole('heading', { name: 'יציבות הדרום' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'מגע ראשון' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'קשרי מחוז' })).not.toBeInTheDocument()
  })

  it('does not spuriously re-narrate content that was already unlocked in the save', async () => {
    const { world, playerProgress } = completedFirstContactSave()
    saveCurrentGame(world, playerProgress)

    renderGameApp()
    await readyRunButton()

    // First Contact is already completed per the save, so booting into it is
    // a revisit, not a fresh start (Step 1, v0.2) — Odin has nothing new to
    // narrate about *unlock* progress: no re-announcement of District Ties
    // becoming available, since that already happened in a prior session.
    // District Ties itself, however, is the player's real current mission
    // (the progression fix now correctly loads it, not the already-finished
    // First Contact) and genuinely is starting for the first time this
    // session, so its own "mission started" line is expected and becomes
    // the latest message — with the Meridian 1.3 welcome-back line (Core
    // Loop §01) preserved just behind it in history, not lost.
    // MissionStarted publishes once District Ties's own database finishes
    // preparing — a separate async chain from readyRunButton's own wait, so
    // this needs its own waitFor rather than assuming it has already landed.
    // Playtest fix pass (issue 6B) — mission-started now interpolates the
    // actual mission's own title (District Ties, the real current mission
    // here, per this test's own comment above).
    await waitFor(() =>
      expect(screen.getByTestId('odin-latest-message')).toHaveTextContent('משימה חדשה מתחילה: קשרי מחוז. אני מקשיב.'),
    )
    expect(screen.getByRole('list', { name: he.odinHistoryAriaLabel })).toHaveTextContent('ברוך שובך למרידיאן')
    // The one thing this test actually guards: no spurious re-narration of
    // content unlocked in a prior session (the ContentUnlocked reaction for
    // District Ties becoming available must not fire again on this boot).
    expect(screen.queryByText(/להתחקות אחר קשרי המחוז/)).not.toBeInTheDocument()
  })

  it('falls back to a fresh game when the saved data is corrupted, without crashing', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    window.localStorage.setItem(SAVE_KEY, 'not valid json{')

    renderGameApp()
    await readyRunButton()

    expect(screen.getByText(`${he.progressLabelPrefix}0%`)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`${he.nextLabelPrefix}קשרי מחוז \\(${he.locked}\\)`))).toBeInTheDocument()
    expect(errorSpy).not.toHaveBeenCalled()

    errorSpy.mockRestore()
  })
})

describe('New Game reset', () => {
  it('clears the save and resets world and progress', async () => {
    renderGameApp()
    const runButton = await readyRunButton()
    openDebugView()

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)
    await screen.findByText(he.pass)
    await waitFor(() => expect(screen.getByText(`${he.progressLabelPrefix}${ONE_MISSION_PERCENTAGE}%`)).toBeInTheDocument())

    ensureSettingsMenuOpen()
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
    renderGameApp()
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

    renderGameApp()
    const runButton = await readyRunButton()

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)
    await screen.findByText(he.pass)

    ensureSettingsMenuOpen()
    fireEvent.click(screen.getByTestId('save-button'))
    newGame()
    await waitFor(() => expect(screen.getByText(`${he.progressLabelPrefix}0%`)).toBeInTheDocument())

    expect(errorSpy).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('clears session-scoped UI state left over from before the reset (active mission, selected NPC)', async () => {
    renderGameApp()
    const runButton = await readyRunButton()

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)
    await screen.findByText(he.pass)

    // Move off the first mission and open an NPC's bio — both are
    // session-scoped state (activeMissionId, selectedNpcId), never part of
    // SaveGame, so a plain world/progress replace does not touch them.
    fireEvent.click(screen.getByRole('button', { name: `קשרי מחוז (${he.available})` }))
    await readyRunButton()
    fireEvent.click(document.querySelector('[data-npc-id="archivist-mera"]')!)
    expect(screen.getByTestId('npc-bio-panel')).toBeInTheDocument()

    newGame()

    // Regression guard: before the fix, activeMissionId/selectedNpcId (and
    // activeLessonId/sceneState) survived New Game entirely, so a mission
    // loaded in the console or an open NPC bio could persist into the "new"
    // game within the same mounted session.
    expect(screen.getByRole('heading', { name: 'מגע ראשון' })).toBeInTheDocument()
    expect(screen.queryByTestId('npc-bio-panel')).not.toBeInTheDocument()
  })

  it('resets Archive Pages and NPC familiarity, not just missions and world', async () => {
    const progress = {
      ...createInitialPlayerProgress(defaultCampaign),
      collectedArchivePageIds: ['archive-page:trade-count'],
      npcFamiliarity: { 'archivist-mera': 5 },
    }
    saveCurrentGame(createWorldState(initialDistricts), progress)

    renderGameApp()
    await readyRunButton()
    expect(screen.getByTestId('quest-track-archive-pages-button')).toHaveTextContent(/1$/)

    newGame()

    expect(screen.getByTestId('quest-track-archive-pages-button')).toHaveTextContent(/0$/)

    // Confirm the reset actually lands in a fresh save, not just this
    // render — these are both optional PlayerProgress fields a partial
    // reset could silently leave behind.
    ensureSettingsMenuOpen()
    fireEvent.click(screen.getByTestId('save-button'))
    const saved = JSON.parse(window.localStorage.getItem(SAVE_KEY)!)
    expect(saved.playerProgress.collectedArchivePageIds ?? []).toEqual([])
    expect(saved.playerProgress.npcFamiliarity ?? {}).toEqual({})
  })

  it('does nothing until the reset is confirmed, and Cancel dismisses the prompt without resetting', async () => {
    renderGameApp()
    const runButton = await readyRunButton()

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)
    await screen.findByText(he.pass)
    await waitFor(() => expect(screen.getByText(`${he.progressLabelPrefix}${ONE_MISSION_PERCENTAGE}%`)).toBeInTheDocument())

    ensureSettingsMenuOpen()
    fireEvent.click(screen.getByTestId('new-game-button'))
    expect(screen.getByTestId('reset-confirm-prompt')).toBeInTheDocument()
    // Progress is untouched while the confirmation is pending.
    expect(screen.getByText(`${he.progressLabelPrefix}${ONE_MISSION_PERCENTAGE}%`)).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('confirm-reset-cancel-button'))
    expect(screen.queryByTestId('reset-confirm-prompt')).not.toBeInTheDocument()
    expect(screen.getByText(`${he.progressLabelPrefix}${ONE_MISSION_PERCENTAGE}%`)).toBeInTheDocument()
  })
})
