// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import GameApp from '../GameApp'
import { he } from '../i18n'
import { missionRegistry } from '../missions'
import { markOnboardingComplete } from '../onboarding'

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

beforeEach(() => {
  window.localStorage.clear()
  // This file's own save/load isolation needs a fully-clean localStorage
  // (no leftover save from a prior test) — but that also wipes the global
  // setup's onboarding flag, so re-seed it here.
  markOnboardingComplete()
})

describe('Save/Load restores world and progress across a simulated reload', () => {
  it('persists mission completion and world state, then boots straight into them on the next app instance', async () => {
    const first = render(<GameApp />)
    const runButton = await readyRunButton()
    openDebugView()

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)
    await screen.findByText(he.pass)

    const expectedPercentage = Math.round(100 / missionRegistry.length)
    await waitFor(() => expect(screen.getByText(/"signal": 100/)).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText(`${he.progressLabelPrefix}${expectedPercentage}%`)).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('save-button'))
    first.unmount()

    // A brand new App instance starts from the same fresh initial state a
    // real page reload would, except that Step 23's load-on-boot now finds
    // the save and restores it immediately — no Load click needed.
    render(<GameApp />)
    await readyRunButton()
    openDebugView()

    expect(screen.getByText(`${he.progressLabelPrefix}${expectedPercentage}%`)).toBeInTheDocument()
    expect(screen.getByText(/"signal": 100/)).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(`${he.nextLabelPrefix}קשרי מחוז \\(${he.available}\\)`)),
    ).toBeInTheDocument()
  })

  it('does nothing when Load is clicked with no save present', async () => {
    render(<GameApp />)
    await readyRunButton()

    expect(screen.getByText(`${he.progressLabelPrefix}0%`)).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('load-button'))

    expect(screen.getByText(`${he.progressLabelPrefix}0%`)).toBeInTheDocument()
  })
})
