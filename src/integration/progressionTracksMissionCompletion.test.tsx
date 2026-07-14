// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GameApp from '../GameApp'
import { missionRegistry } from '../missions'

vi.mock('../db/database', async () => {
  const { createTestDatabase } = await import('../verifier/testDb')
  return { createDatabase: createTestDatabase }
})

const percentPerMission = Math.round(100 / missionRegistry.length)

async function readyRunButton() {
  const runButton = await screen.findByRole('button', { name: 'Run' })
  await waitFor(() => expect(runButton).toBeEnabled())
  return runButton
}

describe('Progression tracks mission completion end to end', () => {
  it('starts at 0% with the mission available', async () => {
    render(<GameApp />)
    await readyRunButton()

    expect(screen.getByText('Progress: 0%')).toBeInTheDocument()
    expect(screen.getByText('Content: Available')).toBeInTheDocument()
  })

  it('advances by one mission worth of progress once the first mission passes', async () => {
    render(<GameApp />)
    const runButton = await readyRunButton()

    fireEvent.change(screen.getByPlaceholderText('-- write your query here'), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)

    await screen.findByText('Pass')
    expect(screen.getByText(`Progress: ${percentPerMission}%`)).toBeInTheDocument()
    expect(screen.getByText('Content: Completed')).toBeInTheDocument()
  })

  it('does not advance progress on a failing query', async () => {
    render(<GameApp />)
    const runButton = await readyRunButton()

    fireEvent.change(screen.getByPlaceholderText('-- write your query here'), {
      target: { value: 'SELECT * FROM citizens WHERE id = 1;' },
    })
    fireEvent.click(runButton)

    await screen.findByText('Fail')
    expect(screen.getByText('Progress: 0%')).toBeInTheDocument()
    expect(screen.getByText('Content: Available')).toBeInTheDocument()
  })
})
