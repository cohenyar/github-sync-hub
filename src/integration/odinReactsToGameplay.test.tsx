// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GameApp from '../GameApp'

vi.mock('../db/database', async () => {
  const { createTestDatabase } = await import('../verifier/testDb')
  return { createDatabase: createTestDatabase }
})

async function readyRunButton() {
  const runButton = await screen.findByRole('button', { name: 'Run' })
  await waitFor(() => expect(runButton).toBeEnabled())
  return runButton
}

describe('Odin reacts to real gameplay end to end', () => {
  it('greets the player once the mission database is ready', async () => {
    render(<GameApp />)
    await readyRunButton()

    await waitFor(() => {
      expect(screen.getByText('A new query awaits. I am listening.')).toBeInTheDocument()
    })
    expect(screen.getByText('Status: Deterministic / Offline')).toBeInTheDocument()
  })

  it('comments on the restored signal when First Contact passes, then hints at District Ties unlocking', async () => {
    render(<GameApp />)
    const runButton = await readyRunButton()

    fireEvent.change(screen.getByPlaceholderText('-- write your query here'), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)

    await screen.findByText('Pass')

    await waitFor(() => {
      expect(screen.getByText('The signal is steady now. Meridian can see its people again.')).toBeInTheDocument()
    })

    // District Ties unlocking follows in the narration history once the
    // unlock-reaction effect catches up to the updated progress.
    await waitFor(() => {
      expect(
        screen.getByText('The city is beginning to respond. District Ties is ready to be traced.'),
      ).toBeInTheDocument()
    })
  })

  it('does not narrate a mission completion for a failing query, but does narrate the failure', async () => {
    render(<GameApp />)
    const runButton = await readyRunButton()

    fireEvent.change(screen.getByPlaceholderText('-- write your query here'), {
      target: { value: 'SELECT * FROM citizens WHERE id = 1;' },
    })
    fireEvent.click(runButton)

    await screen.findByText('Fail')

    expect(screen.queryByText(/signal is steady/)).not.toBeInTheDocument()
    await waitFor(() => {
      expect(
        screen.getByText("Close, but the records don't match yet. Look again at what the query returns."),
      ).toBeInTheDocument()
    })
  })

  it('narrates a SQL error distinctly from a row mismatch', async () => {
    render(<GameApp />)
    const runButton = await readyRunButton()

    fireEvent.change(screen.getByPlaceholderText('-- write your query here'), {
      target: { value: 'NOT VALID SQL' },
    })
    fireEvent.click(runButton)

    await screen.findByText(/SQL error/)

    await waitFor(() => {
      expect(screen.getByText("That query didn't run. Check the syntax and try again.")).toBeInTheDocument()
    })
  })

  it('narrates a mission-specific hint for a mismatched query on District Ties, not the generic one', async () => {
    render(<GameApp />)
    const runButton = await readyRunButton()

    // Pass First Contact to unlock District Ties.
    fireEvent.change(screen.getByPlaceholderText('-- write your query here'), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)
    await screen.findByText('Pass')

    fireEvent.click(await screen.findByRole('button', { name: 'District Ties (Available)' }))
    await readyRunButton()

    // Wrong district value — a valid query, wrong result.
    fireEvent.change(screen.getByPlaceholderText('-- write your query here'), {
      target: { value: "SELECT * FROM citizens WHERE district = 'south';" },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))

    await screen.findByText('Fail')

    await waitFor(() => {
      expect(
        screen.getByText('Check the district value in your WHERE clause — it should match North exactly.'),
      ).toBeInTheDocument()
    })
    expect(
      screen.queryByText("Close, but the records don't match yet. Look again at what the query returns."),
    ).not.toBeInTheDocument()
  })
})
