// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { he } from '../i18n'
import { renderGameApp, submitMultipleChoiceAnswer } from '../test/renderGameApp'

// The real createDatabase() loads sql.js's wasm binary via a Vite asset URL,
// which has no server to fetch from under jsdom. Swap in the Node-friendly
// test loader so App renders without touching the network.
// SQL-removal pass — every real mission is now a question mission with no
// async database step, so there's nothing left to wait "ready" for; only
// the World Scene -> classic dashboard switch (unchanged) is still needed
// before the question panel is on screen.
function switchToClassicDashboard() {
  if (screen.queryByTestId('world-scene-3d')) {
    fireEvent.click(screen.getByTestId('settings-menu-button'))
    fireEvent.click(screen.getByTestId('toggle-world-scene-button'))
  }
}

// The raw world-state JSON is a collapsed debug view (Sprint 1 polish) —
// expand it before asserting on its contents.
function openDebugView() {
  fireEvent.click(screen.getByRole('button', { name: he.showRawWorldState }))
}

describe('A correct answer changes the visible world (Information is Action)', () => {
  it('raises the core district signal to 100 once First Contact passes', async () => {
    renderGameApp()
    switchToClassicDashboard()
    openDebugView()

    expect(screen.getByText(/"signal": 0/)).toBeInTheDocument()

    // First Contact is now "The First Emperor" (History, multiple choice) —
    // option 0 (אוגוסטוס) is the correct answer (see missions/firstContact.ts).
    submitMultipleChoiceAnswer(0)

    await screen.findByText(he.exerciseCorrectFeedback)
    expect(screen.getByText(/"signal": 100/)).toBeInTheDocument()
    expect(screen.queryByText(/"signal": 0/)).not.toBeInTheDocument()
  })

  it('leaves the world unchanged when the answer is wrong', async () => {
    renderGameApp()
    switchToClassicDashboard()
    openDebugView()

    // Option 1 (נירון) is a distractor, not the correct answer. The exact
    // wording of the failure feedback is difficulty-level-dependent (see
    // QuestionAnswerPanel); the fail verdict itself is what this test
    // actually cares about.
    submitMultipleChoiceAnswer(1)

    const feedback = await screen.findByTestId('question-feedback')
    expect(feedback).toHaveAttribute('data-verdict', 'fail')
    expect(screen.getByText(/"signal": 0/)).toBeInTheDocument()
  })
})
