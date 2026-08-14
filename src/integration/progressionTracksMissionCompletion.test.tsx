// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { he } from '../i18n'
import { missionRegistry } from '../missions'
import { renderGameApp, submitMultipleChoiceAnswer } from '../test/renderGameApp'

const percentPerMission = Math.round(100 / missionRegistry.length)

// SQL-removal pass — every real mission is now a question mission with no
// async "mission database" step, so there's no "wait until Run is enabled"
// step left to poll for; only the World Scene -> classic dashboard switch
// (unchanged) is still needed before the question panel is on screen.
function switchToClassicDashboard() {
  if (screen.queryByTestId('world-scene-3d')) {
    fireEvent.click(screen.getByTestId('settings-menu-button'))
    fireEvent.click(screen.getByTestId('toggle-world-scene-button'))
  }
}

describe('Progression tracks mission completion end to end', () => {
  it('starts at 0% with the mission available', () => {
    renderGameApp()
    switchToClassicDashboard()

    expect(screen.getByText(`${he.progressLabelPrefix}0%`)).toBeInTheDocument()
    expect(screen.getByText(`${he.contentLabelPrefix}${he.available}`)).toBeInTheDocument()
  })

  it('advances by one mission worth of progress once the first mission passes', async () => {
    renderGameApp()
    switchToClassicDashboard()

    // First Contact is now "The First Emperor" (History, multiple choice) —
    // option 0 (אוגוסטוס) is the correct answer (see missions/firstContact.ts).
    submitMultipleChoiceAnswer(0)

    await screen.findByText(he.exerciseCorrectFeedback)
    expect(screen.getByText(`${he.progressLabelPrefix}${percentPerMission}%`)).toBeInTheDocument()
    expect(screen.getByText(`${he.contentLabelPrefix}${he.completed}`)).toBeInTheDocument()
  })

  it('does not advance progress on a wrong answer', async () => {
    renderGameApp()
    switchToClassicDashboard()

    // Option 1 (נירון) is a distractor, not the correct answer — the
    // question-mission counterpart to the old failing SQL query. The exact
    // feedback copy depends on difficultyLevel (see QuestionAnswerPanel), so
    // wait on the difficulty-agnostic data-verdict flag rather than a
    // specific string.
    submitMultipleChoiceAnswer(1)

    await waitFor(() => {
      expect(screen.getByTestId('question-feedback')).toHaveAttribute('data-verdict', 'fail')
    })
    expect(screen.getByText(`${he.progressLabelPrefix}0%`)).toBeInTheDocument()
    expect(screen.getByText(`${he.contentLabelPrefix}${he.available}`)).toBeInTheDocument()
  })
})
