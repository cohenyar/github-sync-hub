// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GameApp from './GameApp'

// The real createDatabase() loads sql.js's wasm binary via a Vite asset URL,
// which has no server to fetch from under jsdom. Swap in the Node-friendly
// test loader so App renders without touching the network.
vi.mock('./db/database', async () => {
  const { createTestDatabase } = await import('./verifier/testDb')
  return { createDatabase: createTestDatabase }
})

describe('App', () => {
  it('renders the world map with the sample districts', () => {
    render(<GameApp />)
    // District cards are identified by their internal id (stable data
    // attribute); the visible label is now a friendly display name, so query
    // by the id rather than the label text.
    expect(document.querySelector('[data-district-id="north"]')).toBeInTheDocument()
    expect(document.querySelector('[data-district-id="south"]')).toBeInTheDocument()
    expect(document.querySelector('[data-district-id="east"]')).toBeInTheDocument()
  })

  it('starts the Run button disabled until the mission database is ready', () => {
    render(<GameApp />)
    expect(screen.getByRole('button', { name: 'Run' })).toBeDisabled()
  })

  it('renders the Mission panel content and the Odin placeholder', () => {
    render(<GameApp />)
    const missionRegion = screen.getByRole('region', { name: 'Mission' })
    expect(missionRegion).toBeInTheDocument()
    // The active mission title now also appears in the Journey Summary, so
    // scope this to the Mission panel to assert its own content specifically.
    expect(within(missionRegion).getByText('First Contact')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Odin' })).toBeInTheDocument()
  })
})
