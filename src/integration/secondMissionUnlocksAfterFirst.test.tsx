// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GameApp from '../GameApp'
import { missionRegistry } from '../missions'

vi.mock('../db/database', async () => {
  const { createTestDatabase } = await import('../verifier/testDb')
  return { createDatabase: createTestDatabase }
})

const TOTAL_MISSIONS = missionRegistry.length

async function readyRunButton() {
  const runButton = await screen.findByRole('button', { name: 'Run' })
  await waitFor(() => expect(runButton).toBeEnabled())
  return runButton
}

describe('The second mission is gated behind the first, live in the app', () => {
  it(`shows District Ties as Locked, and "Mission 1 of ${TOTAL_MISSIONS}", before First Contact passes`, async () => {
    render(<GameApp />)
    await readyRunButton()

    expect(screen.getByText(`Mission 1 of ${TOTAL_MISSIONS}`)).toBeInTheDocument()
    expect(screen.getByText('Next: District Ties (Locked)')).toBeInTheDocument()
  })

  it(`flips District Ties to Available and shows "Mission 2 of ${TOTAL_MISSIONS}" once First Contact passes`, async () => {
    render(<GameApp />)
    const runButton = await readyRunButton()

    fireEvent.change(screen.getByPlaceholderText('-- write your query here'), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)

    await screen.findByText('Pass')

    expect(screen.getByText(`Mission 2 of ${TOTAL_MISSIONS}`)).toBeInTheDocument()
    expect(screen.getByText('Next: District Ties (Available)')).toBeInTheDocument()
  })

  it(`leaves District Ties Locked and stays on "Mission 1 of ${TOTAL_MISSIONS}" if First Contact fails`, async () => {
    render(<GameApp />)
    const runButton = await readyRunButton()

    fireEvent.change(screen.getByPlaceholderText('-- write your query here'), {
      target: { value: 'SELECT * FROM citizens WHERE id = 1;' },
    })
    fireEvent.click(runButton)

    await screen.findByText('Fail')

    expect(screen.getByText(`Mission 1 of ${TOTAL_MISSIONS}`)).toBeInTheDocument()
    expect(screen.getByText('Next: District Ties (Locked)')).toBeInTheDocument()
  })
})
