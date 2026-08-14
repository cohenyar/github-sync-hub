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

describe('Clicking an NPC marker on the World Map', () => {
  it('opens a read-only bio panel with that NPC’s own registry fields, and Close dismisses it', async () => {
    renderGameApp()
    switchToClassicDashboard()

    // Devrin Kass (north-warden) has no unlock conditions, so it's visible
    // from a fresh boot with no mission progress needed.
    const marker = screen.getByText('Devrin Kass')
    fireEvent.click(marker)

    expect(await screen.findByRole('heading', { name: 'Devrin Kass' })).toBeInTheDocument()
    expect(screen.getByText(/שומר המחוז/)).toBeInTheDocument()
    expect(screen.getByText('שומר על נאמנות מחוז הצפון למרידיאן.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: he.close }))

    expect(screen.queryByRole('heading', { name: 'Devrin Kass' })).not.toBeInTheDocument()
  })

  it('does not affect mission gameplay or Odin', async () => {
    renderGameApp()
    switchToClassicDashboard()

    fireEvent.click(screen.getByText('Devrin Kass'))
    await screen.findByRole('heading', { name: 'Devrin Kass' })
    fireEvent.click(screen.getByRole('button', { name: he.close }))

    switchToClassicDashboard()
    submitMultipleChoiceAnswer(0) // First Contact: אוגוסטוס

    await screen.findByText(he.exerciseCorrectFeedback)
  })
})
