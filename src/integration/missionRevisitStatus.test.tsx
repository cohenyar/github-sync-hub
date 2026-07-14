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

describe('Revisiting an already-completed mission', () => {
  it('shows Status: Completed immediately, never Status: In Progress', async () => {
    render(<GameApp />)
    const runButton = await readyRunButton()

    fireEvent.change(screen.getByPlaceholderText('-- write your query here'), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)
    await screen.findByText('Pass')

    // Move on to District Ties, which real progression now unlocks.
    await screen.findByRole('button', { name: 'District Ties (Available)' })
    fireEvent.click(screen.getByRole('button', { name: 'District Ties (Available)' }))
    await readyRunButton()

    // Switch back to the now-completed First Contact.
    fireEvent.click(screen.getByRole('button', { name: 'First Contact (Completed)' }))

    await waitFor(() => expect(screen.getByText('Status: Completed')).toBeInTheDocument())
    expect(screen.queryByText('Status: In Progress')).not.toBeInTheDocument()
  })

  it('still allows re-running the reference query on a revisited completed mission', async () => {
    render(<GameApp />)
    const runButton = await readyRunButton()

    fireEvent.change(screen.getByPlaceholderText('-- write your query here'), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)
    await screen.findByText('Pass')

    fireEvent.click(screen.getByRole('button', { name: 'District Ties (Available)' }))
    await readyRunButton()
    fireEvent.click(screen.getByRole('button', { name: 'First Contact (Completed)' }))
    await waitFor(() => expect(screen.getByText('Status: Completed')).toBeInTheDocument())

    fireEvent.change(screen.getByPlaceholderText('-- write your query here'), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))

    await screen.findByText('Pass')
  })
})
