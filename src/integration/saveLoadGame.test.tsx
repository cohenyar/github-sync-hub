// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import GameApp from '../GameApp'
import { missionRegistry } from '../missions'

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

beforeEach(() => {
  window.localStorage.clear()
})

describe('Save/Load restores world and progress across a simulated reload', () => {
  it('persists mission completion and world state, then boots straight into them on the next app instance', async () => {
    const first = render(<GameApp />)
    const runButton = await readyRunButton()
    openDebugView()

    fireEvent.change(screen.getByPlaceholderText('-- write your query here'), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)
    await screen.findByText('Pass')

    const expectedPercentage = Math.round(100 / missionRegistry.length)
    await waitFor(() => expect(screen.getByText(/"signal": 100/)).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText(`Progress: ${expectedPercentage}%`)).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    first.unmount()

    // A brand new App instance starts from the same fresh initial state a
    // real page reload would, except that Step 23's load-on-boot now finds
    // the save and restores it immediately — no Load click needed.
    render(<GameApp />)
    await readyRunButton()
    openDebugView()

    expect(screen.getByText(`Progress: ${expectedPercentage}%`)).toBeInTheDocument()
    expect(screen.getByText(/"signal": 100/)).toBeInTheDocument()
    expect(screen.getByText(/Next: District Ties \(Available\)/)).toBeInTheDocument()
  })

  it('does nothing when Load is clicked with no save present', async () => {
    render(<GameApp />)
    await readyRunButton()

    expect(screen.getByText('Progress: 0%')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Load' }))

    expect(screen.getByText('Progress: 0%')).toBeInTheDocument()
  })
})
