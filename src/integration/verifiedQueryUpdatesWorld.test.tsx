// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GameApp from '../GameApp'

// The real createDatabase() loads sql.js's wasm binary via a Vite asset URL,
// which has no server to fetch from under jsdom. Swap in the Node-friendly
// test loader so App renders without touching the network.
vi.mock('../db/database', async () => {
  const { createTestDatabase } = await import('../verifier/testDb')
  return { createDatabase: createTestDatabase }
})

async function readyRunButton() {
  const runButton = await screen.findByRole('button', { name: 'Run' })
  await waitFor(() => expect(runButton).toBeEnabled())
  return runButton
}

// The raw world-state JSON is a collapsed debug view (Sprint 1 polish) —
// expand it before asserting on its contents.
function openDebugView() {
  fireEvent.click(screen.getByRole('button', { name: 'Show Raw World State' }))
}

describe('A verified query changes the visible world (Information is Action)', () => {
  it('raises the core district signal to 100 once First Contact passes', async () => {
    render(<GameApp />)
    const runButton = await readyRunButton()
    openDebugView()

    expect(screen.getByText(/"signal": 0/)).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('-- write your query here'), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)

    await screen.findByText('Pass')
    expect(screen.getByText(/"signal": 100/)).toBeInTheDocument()
    expect(screen.queryByText(/"signal": 0/)).not.toBeInTheDocument()
  })

  it('leaves the world unchanged when the query fails', async () => {
    render(<GameApp />)
    const runButton = await readyRunButton()
    openDebugView()

    fireEvent.change(screen.getByPlaceholderText('-- write your query here'), {
      target: { value: 'SELECT * FROM citizens WHERE id = 1;' },
    })
    fireEvent.click(runButton)

    await screen.findByText('Fail')
    expect(screen.getByText(/"signal": 0/)).toBeInTheDocument()
  })
})
