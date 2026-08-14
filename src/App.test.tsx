// @vitest-environment jsdom
import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { he } from './i18n'
import { markOnboardingComplete } from './onboarding'
import { renderGameApp } from './test/renderGameApp'

// Onboarding: a fresh player now sees the boot sequence before anything
// else, and the World Scene (not the classic dashboard) is the default view
// afterward. These tests are specifically about the classic dashboard's
// Mission panel/world map/SQL console, so each pre-seeds the onboarding
// flag (as a returning player would have) and switches to the classic view
// the same way a player would, via the existing toggle button — nothing
// about the classic dashboard's own rendering changed.
function renderReturningPlayer() {
  markOnboardingComplete()
  renderGameApp()
  fireEvent.click(screen.getByTestId('settings-menu-button'))
  fireEvent.click(screen.getByTestId('toggle-world-scene-button'))
}

describe('App', () => {
  it('renders the world map with the sample districts', () => {
    renderReturningPlayer()
    // District cards are identified by their internal id (stable data
    // attribute); the visible label is now a friendly display name, so query
    // by the id rather than the label text.
    expect(document.querySelector('[data-district-id="north"]')).toBeInTheDocument()
    expect(document.querySelector('[data-district-id="south"]')).toBeInTheDocument()
    expect(document.querySelector('[data-district-id="east"]')).toBeInTheDocument()
  })

  // SQL-removal pass — every real mission is now a question mission with no
  // async database step, so there's no "disabled until ready" state left to
  // prove; what actually matters is that the question panel (not a SQL
  // console) is what's shown.
  it('shows the question panel immediately, not a SQL console', () => {
    renderReturningPlayer()
    expect(screen.getByTestId('question-panel')).toBeInTheDocument()
    expect(screen.queryByTestId('sql-input')).not.toBeInTheDocument()
    expect(screen.queryByTestId('run-button')).not.toBeInTheDocument()
  })

  it('renders the Mission panel content and the Odin placeholder', () => {
    renderReturningPlayer()
    const missionRegion = screen.getByRole('region', { name: he.missionPanelTitle })
    expect(missionRegion).toBeInTheDocument()
    // The active mission title now also appears in the Journey Summary, so
    // scope this to the Mission panel to assert its own content specifically.
    // First Contact is now "הקיסר הראשון" (The First Emperor) — SQL-removal pass.
    expect(within(missionRegion).getByText('הקיסר הראשון')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Odin' })).toBeInTheDocument()
  })
})
