// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GameApp from './GameApp'
import { he } from './i18n'
import { markOnboardingComplete } from './onboarding'

// The real createDatabase() loads sql.js's wasm binary via a Vite asset URL,
// which has no server to fetch from under jsdom. Swap in the Node-friendly
// test loader so App renders without touching the network.
vi.mock('./db/database', async () => {
  const { createTestDatabase } = await import('./verifier/testDb')
  return { createDatabase: createTestDatabase }
})

// Onboarding: a fresh player now sees the boot sequence before anything
// else, and the World Scene (not the classic dashboard) is the default view
// afterward. These tests are specifically about the classic dashboard's
// Mission panel/world map/SQL console, so each pre-seeds the onboarding
// flag (as a returning player would have) and switches to the classic view
// the same way a player would, via the existing toggle button — nothing
// about the classic dashboard's own rendering changed.
function renderReturningPlayer() {
  markOnboardingComplete()
  render(<GameApp />)
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

  it('starts the Run button disabled until the mission database is ready', () => {
    renderReturningPlayer()
    expect(screen.getByRole('button', { name: he.run })).toBeDisabled()
  })

  it('renders the Mission panel content and the Odin placeholder', () => {
    renderReturningPlayer()
    const missionRegion = screen.getByRole('region', { name: he.missionPanelTitle })
    expect(missionRegion).toBeInTheDocument()
    // The active mission title now also appears in the Journey Summary, so
    // scope this to the Mission panel to assert its own content specifically.
    expect(within(missionRegion).getByText('מגע ראשון')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Odin' })).toBeInTheDocument()
  })
})
