// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
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
    expect(screen.getByText('north')).toBeInTheDocument()
    expect(screen.getByText('south')).toBeInTheDocument()
    expect(screen.getByText('east')).toBeInTheDocument()
  })

  it('starts the Run button disabled until the mission database is ready', () => {
    render(<GameApp />)
    expect(screen.getByRole('button', { name: 'Run' })).toBeDisabled()
  })

  it('renders the Mission panel content and the Odin placeholder', () => {
    render(<GameApp />)
    expect(screen.getByRole('region', { name: 'Mission' })).toBeInTheDocument()
    expect(screen.getByText('First Contact')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Odin' })).toBeInTheDocument()
  })
})
