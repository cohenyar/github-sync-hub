// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
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

describe('The Continue to Next Mission CTA', () => {
  it('is absent before a mission completes, then loads the next mission when clicked', async () => {
    renderGameApp()
    switchToClassicDashboard()

    expect(
      screen.queryByRole('button', { name: new RegExp(`^${he.continueToPrefix}`) }),
    ).not.toBeInTheDocument()

    submitMultipleChoiceAnswer(0) // First Contact: אוגוסטוס
    await screen.findByText(he.exerciseCorrectFeedback)

    const continueButton = await screen.findByRole('button', { name: `${he.continueToPrefix}תרגום: ספרייה` })
    fireEvent.click(continueButton)

    // The question panel reloads with District Ties' own setup, and the
    // Mission panel now reflects it as the active mission.
    expect(screen.getByRole('heading', { name: 'תרגום: ספרייה' })).toBeInTheDocument()
  })
})
