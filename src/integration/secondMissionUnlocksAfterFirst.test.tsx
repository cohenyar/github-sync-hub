// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { he } from '../i18n'
import { missionRegistry } from '../missions'
import { renderGameApp } from '../test/renderGameApp'

vi.mock('../db/database', async () => {
  const { createTestDatabase } = await import('../verifier/testDb')
  return { createDatabase: createTestDatabase }
})

const TOTAL_MISSIONS = missionRegistry.length

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

describe('The second mission is gated behind the first, live in the app', () => {
  it(`shows District Ties as Locked, and "Mission 1 of ${TOTAL_MISSIONS}", before First Contact passes`, async () => {
    renderGameApp()
    await readyRunButton()

    expect(screen.getByText(`${he.missionLabel} 1 ${he.ofLabel} ${TOTAL_MISSIONS}`)).toBeInTheDocument()
    expect(screen.getByText(`${he.nextLabelPrefix}קשרי מחוז (${he.locked})`)).toBeInTheDocument()
  })

  it(`flips District Ties to Available once First Contact passes, while First Contact (still the active mission) stays "Mission 1 of ${TOTAL_MISSIONS}" (Meridian 1.4)`, async () => {
    renderGameApp()
    const runButton = await readyRunButton()

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)

    await screen.findByText(he.pass)

    // Passing First Contact doesn't switch the active mission away from it —
    // the ordinal badge tracks the mission actually on screen (still order
    // 1), not the campaign's own furthest-incomplete pointer (which has
    // moved to District Ties, order 2) — see the Meridian 1.4 ordinal fix.
    expect(screen.getByText(`${he.missionLabel} 1 ${he.ofLabel} ${TOTAL_MISSIONS}`)).toBeInTheDocument()
    expect(screen.getByText(`${he.nextLabelPrefix}קשרי מחוז (${he.available})`)).toBeInTheDocument()

    // Switching to District Ties is what actually advances the badge to 2.
    fireEvent.click(screen.getByRole('button', { name: `קשרי מחוז (${he.available})` }))
    await readyRunButton()
    expect(screen.getByText(`${he.missionLabel} 2 ${he.ofLabel} ${TOTAL_MISSIONS}`)).toBeInTheDocument()
  })

  it(`leaves District Ties Locked and stays on "Mission 1 of ${TOTAL_MISSIONS}" if First Contact fails`, async () => {
    renderGameApp()
    const runButton = await readyRunButton()

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens WHERE id = 1;' },
    })
    fireEvent.click(runButton)

    await screen.findByText(he.fail)

    expect(screen.getByText(`${he.missionLabel} 1 ${he.ofLabel} ${TOTAL_MISSIONS}`)).toBeInTheDocument()
    expect(screen.getByText(`${he.nextLabelPrefix}קשרי מחוז (${he.locked})`)).toBeInTheDocument()
  })
})
