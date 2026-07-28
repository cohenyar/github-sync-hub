// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GameApp from '../GameApp'
import { he } from '../i18n'

// The real createDatabase() loads sql.js's wasm binary via a Vite asset URL,
// which has no server to fetch from under jsdom. Swap in the Node-friendly
// test loader so App renders without touching the network.
vi.mock('../db/database', async () => {
  const { createTestDatabase } = await import('../verifier/testDb')
  return { createDatabase: createTestDatabase }
})

async function readyRunButton() {
  // The World Scene (not the classic dashboard) is now the default view —
  // switch to the classic dashboard first if we're not there already.
  if (screen.queryByTestId('world-scene-3d')) {
    fireEvent.click(screen.getByTestId('toggle-world-scene-button'))
  }
  const runButton = await screen.findByRole('button', { name: he.run })
  await waitFor(() => expect(runButton).toBeEnabled())
  return runButton
}

// The raw world-state JSON is a collapsed debug view (Sprint 1 polish) —
// expand it before asserting on its contents.
function openDebugView() {
  fireEvent.click(screen.getByRole('button', { name: he.showRawWorldState }))
}

describe('A verified query changes the visible world (Information is Action)', () => {
  it('raises the core district signal to 100 once First Contact passes', async () => {
    render(<GameApp />)
    const runButton = await readyRunButton()
    openDebugView()

    expect(screen.getByText(/"signal": 0/)).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)

    await screen.findByText(he.pass)
    expect(screen.getByText(/"signal": 100/)).toBeInTheDocument()
    expect(screen.queryByText(/"signal": 0/)).not.toBeInTheDocument()
  })

  it('leaves the world unchanged when the query fails', async () => {
    render(<GameApp />)
    const runButton = await readyRunButton()
    openDebugView()

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens WHERE id = 1;' },
    })
    fireEvent.click(runButton)

    await screen.findByText(he.fail)
    expect(screen.getByText(/"signal": 0/)).toBeInTheDocument()
  })
})
