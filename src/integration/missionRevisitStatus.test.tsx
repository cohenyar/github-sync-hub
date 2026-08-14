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

describe('Revisiting an already-completed mission', () => {
  it('shows Status: Completed immediately, never Status: In Progress', async () => {
    renderGameApp()
    switchToClassicDashboard()

    submitMultipleChoiceAnswer(0) // First Contact: אוגוסטוס
    await screen.findByText(he.exerciseCorrectFeedback)

    // Move on to District Ties, which real progression now unlocks.
    fireEvent.click(screen.getByRole('button', { name: `תרגום: ספרייה (${he.available})` }))

    // Switch back to the now-completed First Contact.
    fireEvent.click(screen.getByRole('button', { name: `הקיסר הראשון (${he.completed})` }))

    await waitFor(() => expect(screen.getByText(`${he.statusLabelPrefix}${he.completed}`)).toBeInTheDocument())
    expect(screen.queryByText(`${he.statusLabelPrefix}${he.phaseActive}`)).not.toBeInTheDocument()
  })

  it('shows the revisited mission\'s own position, never the campaign\'s furthest-incomplete pointer (Meridian 1.4)', async () => {
    renderGameApp()
    switchToClassicDashboard()

    submitMultipleChoiceAnswer(0) // First Contact: אוגוסטוס
    await screen.findByText(he.exerciseCorrectFeedback)

    // Move on to District Ties (order 2) — the campaign's pointer now sits
    // there, but it's no longer what's on screen once we revisit mission 1.
    fireEvent.click(screen.getByRole('button', { name: `תרגום: ספרייה (${he.available})` }))
    expect(screen.getByText(new RegExp(`^${he.missionLabel} 2 ${he.ofLabel} \\d+$`))).toBeInTheDocument()

    // Switch back to the now-completed First Contact (order 1) — the badge
    // must follow the mission actually on screen, not stay pinned at 2.
    fireEvent.click(screen.getByRole('button', { name: `הקיסר הראשון (${he.completed})` }))
    expect(screen.getByText(new RegExp(`^${he.missionLabel} 1 ${he.ofLabel} \\d+$`))).toBeInTheDocument()
  })

  it('still allows re-submitting an answer on a revisited completed mission', async () => {
    renderGameApp()
    switchToClassicDashboard()

    submitMultipleChoiceAnswer(0) // First Contact: אוגוסטוס
    await screen.findByText(he.exerciseCorrectFeedback)

    fireEvent.click(screen.getByRole('button', { name: `תרגום: ספרייה (${he.available})` }))
    fireEvent.click(screen.getByRole('button', { name: `הקיסר הראשון (${he.completed})` }))
    await waitFor(() => expect(screen.getByText(`${he.statusLabelPrefix}${he.completed}`)).toBeInTheDocument())

    submitMultipleChoiceAnswer(0) // First Contact: אוגוסטוס

    await screen.findByText(he.exerciseCorrectFeedback)
  })
})
