// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultCampaign } from '../campaign'
import { he } from '../i18n'
import { firstContactMission, missionRegistry } from '../missions'
import { hasCompletedOnboarding, markOnboardingComplete } from '../onboarding'
import { saveCurrentGame } from '../persistence'
import { createInitialPlayerProgress, recordMissionCompletion } from '../progression'
import { passEntryGates, renderGameApp, submitMultipleChoiceAnswer } from '../test/renderGameApp'
import { applyEffect, createWorldState, initialDistricts } from '../worldState'

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
    switchToClassicDashboard()

    expect(screen.getByText(`${he.progressLabelPrefix}0%`)).toBeInTheDocument()
    // Meridian 2.0 open-world pass — District Ties (English) is always
    // unlocked from the very start, never gated behind First Contact.
    expect(screen.getByText(new RegExp(`${he.nextLabelPrefix}תרגום: ספרייה \\(${he.available}\\)`))).toBeInTheDocument()
    // SQL-removal pass — a question mission has no async "mission database"
    // step, so First Contact (the very first mission of a fresh game) is
    // already active the instant GameApp mounts. That leaves no observable
    // "loading -> active" transition for GameApp's previousPhaseRef effect
    // to publish an initial MissionStarted from (see GameApp.tsx; the same
    // gap is documented in eventBusPublishesOnMissionCompletion.test.tsx),
    // so there is no "mission started" narration to assert on for a fresh
    // boot's own starting mission anymore — the progress/lock checks above
    // are this test's real coverage of "boots into a fresh game."
  })

  it('boots straight into a previously saved game, resuming on the actual current mission', async () => {
    const { world, playerProgress } = completedFirstContactSave()
    saveCurrentGame(world, playerProgress)

    renderGameApp()
    switchToClassicDashboard()
    openDebugView()

    expect(screen.getByText(`${he.progressLabelPrefix}${ONE_MISSION_PERCENTAGE}%`)).toBeInTheDocument()
    expect(screen.getByText(/"signal": 100/)).toBeInTheDocument()
    // Regression guard: the console must load the player's real frontier
    // (District Ties, the mission after the one just completed) directly —
    // not re-open the already-finished First Contact and make the player
    // click "Continue" to get anywhere.
    expect(screen.getByRole('heading', { name: 'תרגום: ספרייה' })).toBeInTheDocument()
    // Meridian 2.0 open-world pass — South Stability (Math) is always
    // unlocked from the very start too, never gated behind another subject.
    expect(
      screen.getByText(new RegExp(`${he.nextLabelPrefix}כפל: 8 × 7 \\(${he.available}\\)`)),
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
    switchToClassicDashboard()

    expect(screen.getByRole('heading', { name: 'כפל: 8 × 7' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'הקיסר הראשון' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'תרגום: ספרייה' })).not.toBeInTheDocument()
  })

  it('does not spuriously re-narrate content that was already unlocked in the save', async () => {
    const { world, playerProgress } = completedFirstContactSave()
    saveCurrentGame(world, playerProgress)

    renderGameApp()
    switchToClassicDashboard()

    // First Contact is already completed per the save, so booting into it is
    // a revisit, not a fresh start (Step 1, v0.2) — Odin has nothing new to
    // narrate about *unlock* progress: no re-announcement of District Ties
    // becoming available, since that already happened in a prior session.
    // District Ties itself is the player's real current mission (the
    // progression fix now correctly loads it, not the already-finished
    // First Contact) — but SQL-removal pass: a question mission has no
    // async "mission database" step, so District Ties is already active
    // the instant GameApp mounts here, same as First Contact would be on a
    // fresh game. That leaves no observable "loading -> active" transition
    // for GameApp's previousPhaseRef effect to publish an initial
    // MissionStarted from (see GameApp.tsx; the same gap is documented in
    // eventBusPublishesOnMissionCompletion.test.tsx), so District Ties gets
    // no "mission started" line of its own on this boot. The Meridian 1.3
    // welcome-back line (Core Loop §01) is therefore still the only, and
    // therefore latest, message — which is exactly what this test needs:
    // confirmation that nothing else (in particular, no spurious
    // re-narration of District Ties unlocking) took its place. OdinPanel
    // only renders its history list once a second entry exists (see
    // OdinPanel.tsx's previousEntries), so with no mission-started line
    // landing beside it, that list stays absent rather than showing the
    // welcome-back line as a "previous" entry.
    await waitFor(() =>
      expect(screen.getByTestId('odin-latest-message')).toHaveTextContent('ברוך שובך למרידיאן. העיר המשיכה לחכות.'),
    )
    expect(screen.queryByRole('list', { name: he.odinHistoryAriaLabel })).not.toBeInTheDocument()
    // The one thing this test actually guards: no spurious re-narration of
    // content unlocked in a prior session. District Ties was never gated in
    // the first place (Meridian 2.0 open-world pass), so the mission that
    // actually transitioned when First Contact completed is Full Signal
    // (History's own second mission) — its ContentUnlocked reaction must
    // not fire again on this boot either.
    expect(screen.queryByText(/להתחקות אחר קשרי המחוז/)).not.toBeInTheDocument()
    expect(screen.queryByText(/אות מלא מוכן/)).not.toBeInTheDocument()
  })

  /**
   * SQL-removal pass, Section 10 backward-compatibility requirement — a
   * save written before this change stores exactly these same mission ids
   * ('first-contact', 'district-ties', ...): the SQL-removal pass
   * deliberately kept every mission's id and successEffect unchanged,
   * swapping only its content and kind (see missions/firstContact.ts and
   * siblings). So a pre-existing save's completedMissionIds/currentMissionId
   * still resolve directly via getMissionById — no id remapping/migration
   * was needed, and none exists. This test hand-authors a save blob (rather
   * than using this file's own helpers, which already run on the new code)
   * to prove that resolution still works from genuinely old-shaped data.
   */
  it('loads an old (pre-SQL-removal) save whose ids reference the same missions, now showing question content', async () => {
    const oldShapedWorld = applyEffect(createWorldState(initialDistricts), firstContactMission.successEffect!)
    const oldShapedProgress = recordMissionCompletion(
      createInitialPlayerProgress(defaultCampaign),
      'first-contact',
      defaultCampaign,
    )
    // Simulates a save written by the old SQL-era app: same shape, same
    // ids — completedMissionIds/currentMissionId always were opaque
    // strings to persistence (see deserializeSaveGame.ts, which validates
    // shape only, never content).
    window.localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({ version: 1, world: oldShapedWorld, playerProgress: oldShapedProgress }),
    )

    renderGameApp()
    switchToClassicDashboard()

    // Resolves straight to the real current mission (District Ties) under
    // its NEW question-mission title — no reset to mission 1, no crash.
    expect(screen.getByRole('heading', { name: 'תרגום: ספרייה' })).toBeInTheDocument()
    expect(screen.getByTestId('question-panel')).toBeInTheDocument()
    expect(screen.getByText(`${he.progressLabelPrefix}${ONE_MISSION_PERCENTAGE}%`)).toBeInTheDocument()
  })

  it('falls back to a fresh game when the saved data is corrupted, without crashing', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    window.localStorage.setItem(SAVE_KEY, 'not valid json{')

    renderGameApp()
    switchToClassicDashboard()

    expect(screen.getByText(`${he.progressLabelPrefix}0%`)).toBeInTheDocument()
    // Meridian 2.0 open-world pass — District Ties (English) is always
    // unlocked from the very start, never gated behind First Contact.
    expect(screen.getByText(new RegExp(`${he.nextLabelPrefix}תרגום: ספרייה \\(${he.available}\\)`))).toBeInTheDocument()
    expect(errorSpy).not.toHaveBeenCalled()

    errorSpy.mockRestore()
  })
})

describe('New Game reset', () => {
  it('clears the save and resets world and progress', async () => {
    renderGameApp()
    switchToClassicDashboard()
    openDebugView()

    // First Contact is now "The First Emperor" (History, multiple choice) —
    // option 0 (אוגוסטוס) is the correct answer (see missions/firstContact.ts).
    submitMultipleChoiceAnswer(0) // אוגוסטוס — the correct answer
    await screen.findByText(he.exerciseCorrectFeedback)
    await waitFor(() => expect(screen.getByText(`${he.progressLabelPrefix}${ONE_MISSION_PERCENTAGE}%`)).toBeInTheDocument())

    ensureSettingsMenuOpen()
    fireEvent.click(screen.getByTestId('save-button'))
    newGame()

    await waitFor(() => expect(screen.getByText(`${he.progressLabelPrefix}0%`)).toBeInTheDocument())
    // Meridian 2.0 open-world pass — District Ties (English) is always
    // unlocked from the very start, never gated behind First Contact.
    expect(screen.getByText(new RegExp(`${he.nextLabelPrefix}תרגום: ספרייה \\(${he.available}\\)`))).toBeInTheDocument()
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
    switchToClassicDashboard()

    submitMultipleChoiceAnswer(0) // אוגוסטוס — the correct answer
    await screen.findByText(he.exerciseCorrectFeedback)
    await waitFor(() =>
      expect(
        screen.getByText('אות מלא מוכן — כל העיר, נראית כאחת בפעם הראשונה.'),
      ).toBeInTheDocument(),
    )

    newGame()
    await waitFor(() => expect(screen.getByText(`${he.progressLabelPrefix}0%`)).toBeInTheDocument())

    // The unlock re-check effect re-runs against the reset (empty) progress;
    // it must not treat anything as newly unlocked and add a second
    // District Ties narration on top of the one already in history.
    expect(
      screen.getByText('אות מלא מוכן — כל העיר, נראית כאחת בפעם הראשונה.'),
    ).toBeInTheDocument()
  })

  it('keeps the app stable with no console errors across a full New Game cycle', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    renderGameApp()
    switchToClassicDashboard()

    submitMultipleChoiceAnswer(0) // אוגוסטוס — the correct answer
    await screen.findByText(he.exerciseCorrectFeedback)

    ensureSettingsMenuOpen()
    fireEvent.click(screen.getByTestId('save-button'))
    newGame()
    await waitFor(() => expect(screen.getByText(`${he.progressLabelPrefix}0%`)).toBeInTheDocument())

    expect(errorSpy).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('clears session-scoped UI state left over from before the reset (active mission, selected NPC)', async () => {
    renderGameApp()
    switchToClassicDashboard()

    submitMultipleChoiceAnswer(0) // אוגוסטוס — the correct answer
    await screen.findByText(he.exerciseCorrectFeedback)

    // Move off the first mission and open an NPC's bio — both are
    // session-scoped state (activeMissionId, selectedNpcId), never part of
    // SaveGame, so a plain world/progress replace does not touch them.
    fireEvent.click(screen.getByRole('button', { name: `תרגום: ספרייה (${he.available})` }))
    fireEvent.click(document.querySelector('[data-npc-id="archivist-mera"]')!)
    expect(screen.getByTestId('npc-bio-panel')).toBeInTheDocument()

    newGame()

    // Regression guard: before the fix, activeMissionId/selectedNpcId (and
    // activeLessonId/sceneState) survived New Game entirely, so a mission
    // loaded in the console or an open NPC bio could persist into the "new"
    // game within the same mounted session.
    expect(screen.getByRole('heading', { name: 'הקיסר הראשון' })).toBeInTheDocument()
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
    switchToClassicDashboard()
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

  // First Mission UX pass — difficultyLevel is a learning-preference
  // setting, not gameplay progression, so unlike every field the tests
  // above cover (missions, world, Archive Pages, NPC familiarity — and
  // separately, profile identity, which New Game does still clear), it
  // deliberately SURVIVES this reset (see handleConfirmNewGame in
  // GameApp.tsx). The reappearing Profile Creation gate (mandatory once
  // identity is cleared) pre-selects the preserved level via
  // initialDifficultyLevel, so a plain name+submit — exactly what
  // newGame()'s passEntryGates() does — carries it forward rather than
  // silently resetting it to the picker's own unrelated default.
  it('preserves the selected difficultyLevel across New Game, even though missions/lessons/campaign progress reset', async () => {
    const progressed = recordMissionCompletion(
      { ...createInitialPlayerProgress(defaultCampaign), difficultyLevel: 3 as const },
      'first-contact',
      defaultCampaign,
    )
    saveCurrentGame(createWorldState(initialDistricts), progressed)

    renderGameApp()
    switchToClassicDashboard()
    ensureSettingsMenuOpen()
    expect(screen.getByTestId('difficulty-level-3-button')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByTestId('progress-badge')).toHaveAttribute('data-percentage', ONE_MISSION_PERCENTAGE.toString())

    newGame()

    // Gameplay progress reset, same as every other New Game test in this file.
    expect(screen.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '0')

    // Difficulty did not reset — still level 3, both live and in the save.
    ensureSettingsMenuOpen()
    expect(screen.getByTestId('difficulty-level-3-button')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByTestId('difficulty-level-1-button')).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(screen.getByTestId('save-button'))
    const saved = JSON.parse(window.localStorage.getItem(SAVE_KEY)!)
    expect(saved.playerProgress.difficultyLevel).toBe(3)
    expect(saved.playerProgress.completedMissionIds).toEqual([])
  })

  it('a fresh save with no prior difficultyLevel still defaults to 1 after New Game', async () => {
    renderGameApp()
    switchToClassicDashboard()
    ensureSettingsMenuOpen()
    expect(screen.getByTestId('difficulty-level-1-button')).toHaveAttribute('aria-checked', 'true')

    newGame()

    ensureSettingsMenuOpen()
    expect(screen.getByTestId('difficulty-level-1-button')).toHaveAttribute('aria-checked', 'true')
  })

  it('does nothing until the reset is confirmed, and Cancel dismisses the prompt without resetting', async () => {
    renderGameApp()
    switchToClassicDashboard()

    submitMultipleChoiceAnswer(0) // אוגוסטוס — the correct answer
    await screen.findByText(he.exerciseCorrectFeedback)
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
