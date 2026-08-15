// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { he } from '../i18n'
import { missionRegistry } from '../missions'
import { renderGameApp, submitMultipleChoiceAnswer } from '../test/renderGameApp'

const TOTAL_MISSIONS = missionRegistry.length
// District Ties is now "תרגום: ספרייה" (English vocabulary, multiple choice)
// — SQL-removal pass; its id/unlock order/district are unchanged.
const DISTRICT_TIES_TITLE = 'תרגום: ספרייה'

// SQL-removal pass — every real mission is now a question mission with no
// async database step, so there's no "wait for Run to become enabled" step
// left; only the World Scene -> classic dashboard switch (unchanged) is
// still needed before the question panel is on screen.
function switchToClassicDashboard() {
  if (screen.queryByTestId('world-scene-3d')) {
    fireEvent.click(screen.getByTestId('settings-menu-button'))
    fireEvent.click(screen.getByTestId('toggle-world-scene-button'))
  }
}

describe('The second mission is gated behind the first, live in the app', () => {
  it(`shows District Ties as Available (Meridian 2.0 open-world pass — English never waits on History), and "Mission 1 of ${TOTAL_MISSIONS}", from the very start`, () => {
    renderGameApp()
    switchToClassicDashboard()

    expect(screen.getByText(`${he.missionLabel} 1 ${he.ofLabel} ${TOTAL_MISSIONS}`)).toBeInTheDocument()
    expect(screen.getByText(`${he.nextLabelPrefix}${DISTRICT_TIES_TITLE} (${he.available})`)).toBeInTheDocument()
  })

  it(`flips District Ties to Available once First Contact passes, while First Contact (still the active mission) stays "Mission 1 of ${TOTAL_MISSIONS}" (Meridian 1.4)`, async () => {
    renderGameApp()
    switchToClassicDashboard()

    // First Contact is now "הקיסר הראשון" (History, multiple choice) —
    // option 0 (אוגוסטוס) is the correct answer (see missions/firstContact.ts).
    submitMultipleChoiceAnswer(0)
    await screen.findByText(he.exerciseCorrectFeedback)

    // Passing First Contact doesn't switch the active mission away from it —
    // the ordinal badge tracks the mission actually on screen (still order
    // 1), not the campaign's own furthest-incomplete pointer (which has
    // moved to District Ties, order 2) — see the Meridian 1.4 ordinal fix.
    expect(screen.getByText(`${he.missionLabel} 1 ${he.ofLabel} ${TOTAL_MISSIONS}`)).toBeInTheDocument()
    expect(screen.getByText(`${he.nextLabelPrefix}${DISTRICT_TIES_TITLE} (${he.available})`)).toBeInTheDocument()

    // Switching to District Ties is what actually advances the badge to 2.
    fireEvent.click(screen.getByRole('button', { name: `${DISTRICT_TIES_TITLE} (${he.available})` }))
    expect(screen.getByText(`${he.missionLabel} 2 ${he.ofLabel} ${TOTAL_MISSIONS}`)).toBeInTheDocument()
  })

  it(`leaves District Ties Available (it was never gated behind First Contact) and stays on "Mission 1 of ${TOTAL_MISSIONS}" if First Contact fails`, async () => {
    renderGameApp()
    switchToClassicDashboard()

    // Option 1 (נירון) is a distractor, not the correct answer. Asserted via
    // the panel's own data-verdict attribute rather than a literal feedback
    // string, since the exact wording is difficulty-level-dependent (see
    // QuestionAnswerPanel.tsx) and a fresh profile's default level isn't
    // this test's concern.
    submitMultipleChoiceAnswer(1)
    await screen.findByTestId('question-feedback')
    expect(screen.getByTestId('question-feedback')).toHaveAttribute('data-verdict', 'fail')

    expect(screen.getByText(`${he.missionLabel} 1 ${he.ofLabel} ${TOTAL_MISSIONS}`)).toBeInTheDocument()
    expect(screen.getByText(`${he.nextLabelPrefix}${DISTRICT_TIES_TITLE} (${he.available})`)).toBeInTheDocument()
  })
})
