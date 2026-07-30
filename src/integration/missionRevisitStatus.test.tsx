// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { he } from '../i18n'
import { renderGameApp } from '../test/renderGameApp'

vi.mock('../db/database', async () => {
  const { createTestDatabase } = await import('../verifier/testDb')
  return { createDatabase: createTestDatabase }
})

async function readyRunButton() {
  // The World Scene (not the classic dashboard) is now the default view —
  // switch to the classic dashboard first if we're not there already.
  if (screen.queryByTestId('world-scene-3d')) {
    fireEvent.click(screen.getByTestId('settings-menu-button'))
    fireEvent.click(screen.getByTestId('toggle-world-scene-button'))
  }
  const runButton = await screen.findByRole('button', { name: he.run })
  await waitFor(() => expect(runButton).toBeEnabled())
  return runButton
}

describe('Revisiting an already-completed mission', () => {
  it('shows Status: Completed immediately, never Status: In Progress', async () => {
    renderGameApp()
    const runButton = await readyRunButton()

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)
    await screen.findByText(he.pass)

    // Move on to District Ties, which real progression now unlocks.
    await screen.findByRole('button', { name: `קשרי מחוז (${he.available})` })
    fireEvent.click(screen.getByRole('button', { name: `קשרי מחוז (${he.available})` }))
    await readyRunButton()

    // Switch back to the now-completed First Contact.
    fireEvent.click(screen.getByRole('button', { name: `מגע ראשון (${he.completed})` }))

    await waitFor(() => expect(screen.getByText(`${he.statusLabelPrefix}${he.completed}`)).toBeInTheDocument())
    expect(screen.queryByText(`${he.statusLabelPrefix}${he.phaseActive}`)).not.toBeInTheDocument()
  })

  it('shows the revisited mission\'s own position, never the campaign\'s furthest-incomplete pointer (Meridian 1.4)', async () => {
    renderGameApp()
    const runButton = await readyRunButton()

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)
    await screen.findByText(he.pass)

    // Move on to District Ties (order 2) — the campaign's pointer now sits
    // there, but it's no longer what's on screen once we revisit mission 1.
    await screen.findByRole('button', { name: `קשרי מחוז (${he.available})` })
    fireEvent.click(screen.getByRole('button', { name: `קשרי מחוז (${he.available})` }))
    await readyRunButton()
    expect(screen.getByText(new RegExp(`^${he.missionLabel} 2 ${he.ofLabel} \\d+$`))).toBeInTheDocument()

    // Switch back to the now-completed First Contact (order 1) — the badge
    // must follow the mission actually on screen, not stay pinned at 2.
    fireEvent.click(screen.getByRole('button', { name: `מגע ראשון (${he.completed})` }))
    expect(screen.getByText(new RegExp(`^${he.missionLabel} 1 ${he.ofLabel} \\d+$`))).toBeInTheDocument()
  })

  it('still allows re-running the reference query on a revisited completed mission', async () => {
    renderGameApp()
    const runButton = await readyRunButton()

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)
    await screen.findByText(he.pass)

    fireEvent.click(screen.getByRole('button', { name: `קשרי מחוז (${he.available})` }))
    await readyRunButton()
    fireEvent.click(screen.getByRole('button', { name: `מגע ראשון (${he.completed})` }))
    await waitFor(() => expect(screen.getByText(`${he.statusLabelPrefix}${he.completed}`)).toBeInTheDocument())

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(screen.getByRole('button', { name: he.run }))

    await screen.findByText(he.pass)
  })
})
