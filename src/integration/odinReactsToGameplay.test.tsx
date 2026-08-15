// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { he } from '../i18n'
import { renderGameApp, submitMultipleChoiceAnswer } from '../test/renderGameApp'

// SQL-removal pass — every real mission is now a question mission with no
// async database step, so there's nothing left to wait "ready" for; only
// the World Scene -> classic dashboard switch (unchanged) is still needed.
function switchToClassicDashboard() {
  if (screen.queryByTestId('world-scene-3d')) {
    fireEvent.click(screen.getByTestId('settings-menu-button'))
    fireEvent.click(screen.getByTestId('toggle-world-scene-button'))
  }
}

describe('Odin reacts to real gameplay end to end', () => {
  /**
   * SQL-removal pass — a question mission has no async setup step, so it
   * can already be 'active' on the very first render. GameApp.tsx
   * deliberately excludes the very first render from MissionStarted
   * detection (see isFirstMissionStartRenderRef) specifically so this
   * doesn't fire in the same instant as, and overwrite, WorldEntered's own
   * boot greeting — Odin's status/greeting at boot is WorldEntered's job,
   * not MissionStarted's. MissionStarted still fires correctly on every
   * later mission switch (verified below).
   */
  it('shows Odin ready and greeted at boot, with no mission-started narration competing for it', () => {
    renderGameApp()
    switchToClassicDashboard()

    expect(screen.getByText(he.odinStatusLabel)).toBeInTheDocument()
    expect(screen.queryByText(/^משימה חדשה מתחילה/)).not.toBeInTheDocument()
  })

  it('narrates a new mission starting once switching to it, interpolating that mission\'s own title', async () => {
    renderGameApp()
    switchToClassicDashboard()

    submitMultipleChoiceAnswer(0) // אוגוסטוס — passes First Contact, unlocking District Ties
    await screen.findByText(he.exerciseCorrectFeedback)

    fireEvent.click(await screen.findByRole('button', { name: `תרגום: ספרייה (${he.available})` }))

    await waitFor(() => {
      expect(screen.getByText('משימה חדשה מתחילה: תרגום: ספרייה. אני מקשיב.')).toBeInTheDocument()
    })
  })

  it('comments on the restored signal when First Contact passes, then hints at Full Signal unlocking (Meridian 2.0 open-world pass)', async () => {
    renderGameApp()
    switchToClassicDashboard()

    submitMultipleChoiceAnswer(0) // אוגוסטוס — the correct answer
    await screen.findByText(he.exerciseCorrectFeedback)

    await waitFor(() => {
      expect(screen.getByText('האות יציב כעת. מרידיאן שוב רואה את תושביה.')).toBeInTheDocument()
    })

    // District Ties (English) is always unlocked from the start now, so it
    // never transitions here — completing First Contact instead unlocks
    // History's own second mission (Full Signal), which follows in the
    // narration history once the unlock-reaction effect catches up.
    await waitFor(() => {
      expect(
        screen.getByText('אות מלא מוכן — כל העיר, נראית כאחת בפעם הראשונה.'),
      ).toBeInTheDocument()
    })
  })

  /**
   * SQL-removal pass — a question mission has no equivalent to QueryFailed
   * (see GameApp.tsx's useQuestionMission onFailure, and the final SQL-
   * removal report): a wrong answer plays the failure sound and shows
   * in-panel feedback, but does not narrate a mission-specific Odin
   * reaction the way a mismatched/invalid SQL query used to. This replaces
   * three former SQL-specific tests (row mismatch, syntax error, and a
   * mission-specific mismatch hint) that exercised a path no real mission
   * can reach anymore — defaultOdinReactions.test.ts still covers the
   * underlying QueryFailed reaction-matching logic directly, since it
   * remains real, working, legacy code (reachable again if an admin adds a
   * SQL mission back through the legacy admin tool).
   */
  it('does not narrate a mission completion or a QueryFailed-style reaction for a wrong answer', async () => {
    renderGameApp()
    switchToClassicDashboard()

    submitMultipleChoiceAnswer(1) // נירון — a distractor, not the correct answer
    // Asserted via the panel's own data-verdict attribute rather than a
    // literal feedback string, since the exact wording is difficulty-level-
    // dependent (see QuestionAnswerPanel.tsx) and not this test's concern.
    await screen.findByTestId('question-feedback')
    expect(screen.getByTestId('question-feedback')).toHaveAttribute('data-verdict', 'fail')

    expect(screen.queryByText(/האות יציב/)).not.toBeInTheDocument()
    expect(
      screen.queryByText('קרוב, אך הרשומות עדיין לא תואמות. הבט/הביטי שוב במה שהשאילתה מחזירה.'),
    ).not.toBeInTheDocument()
  })
})
