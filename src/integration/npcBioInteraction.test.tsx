// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GameApp from '../GameApp'
import { he } from '../i18n'

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

describe('Clicking an NPC marker on the World Map', () => {
  it('opens a read-only bio panel with that NPC’s own registry fields, and Close dismisses it', async () => {
    render(<GameApp />)
    await readyRunButton()

    // Devrin Kass (north-warden) has no unlock conditions, so it's visible
    // from a fresh boot with no mission progress needed.
    const marker = screen.getByText('Devrin Kass')
    fireEvent.click(marker)

    expect(await screen.findByRole('heading', { name: 'Devrin Kass' })).toBeInTheDocument()
    expect(screen.getByText(/שומר המחוז/)).toBeInTheDocument()
    expect(screen.getByText('שומר על נאמנות מחוז הצפון למרידיאן.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: he.close }))

    expect(screen.queryByRole('heading', { name: 'Devrin Kass' })).not.toBeInTheDocument()
  })

  it('does not affect mission gameplay or Odin', async () => {
    render(<GameApp />)
    await readyRunButton()

    fireEvent.click(screen.getByText('Devrin Kass'))
    await screen.findByRole('heading', { name: 'Devrin Kass' })
    fireEvent.click(screen.getByRole('button', { name: he.close }))

    const runButton = await readyRunButton()
    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)

    await screen.findByText(he.pass)
  })
})
