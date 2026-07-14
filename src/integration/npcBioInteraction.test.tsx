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

describe('Clicking an NPC marker on the World Map', () => {
  it('opens a read-only bio panel with that NPC’s own registry fields, and Close dismisses it', async () => {
    render(<GameApp />)
    await readyRunButton()

    // Devrin Kass (north-warden) has no unlock conditions, so it's visible
    // from a fresh boot with no mission progress needed.
    const marker = screen.getByText('Devrin Kass')
    fireEvent.click(marker)

    expect(await screen.findByRole('heading', { name: 'Devrin Kass' })).toBeInTheDocument()
    expect(screen.getByText(/District Warden/)).toBeInTheDocument()
    expect(screen.getByText("Keeps watch over North district's loyalty to Meridian.")).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(screen.queryByRole('heading', { name: 'Devrin Kass' })).not.toBeInTheDocument()
  })

  it('does not affect mission gameplay or Odin', async () => {
    render(<GameApp />)
    await readyRunButton()

    fireEvent.click(screen.getByText('Devrin Kass'))
    await screen.findByRole('heading', { name: 'Devrin Kass' })
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    const runButton = await readyRunButton()
    fireEvent.change(screen.getByPlaceholderText('-- write your query here'), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)

    await screen.findByText('Pass')
  })
})
