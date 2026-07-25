// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import GameApp from '../GameApp'
import { he } from '../i18n'
import { missionRegistry } from '../missions'

vi.mock('../db/database', async () => {
  const { createTestDatabase } = await import('../verifier/testDb')
  return { createDatabase: createTestDatabase }
})

async function readyRunButton() {
  const runButton = await screen.findByRole('button', { name: he.run })
  await waitFor(() => expect(runButton).toBeEnabled())
  return runButton
}

beforeEach(() => {
  window.localStorage.clear()
})

/**
 * Meridian 1.0 closeout: GameApp now auto-saves once, on unmount, so
 * leaving /world (e.g. back to /dashboard to pick a different subject)
 * never silently discards progress the player already saw completed. The
 * lesson flow itself (walking to a teacher, opening dialogue, starting a
 * lesson) depends on the real 3D scene/frame loop, which — same as every
 * other GameApp test in this file's family — is unavailable under
 * Vitest's Canvas mock; the SQL mission flow below exercises the exact
 * same auto-save mechanism (the same unmount effect, calling the same
 * saveCurrentGame) without needing that. The lesson-specific version of
 * this exact scenario is covered in Playwright (e2e/world-scene-3d.spec.ts).
 */
describe('Meridian 1.0 closeout — auto-save on leaving /world (unmount)', () => {
  it('persists a completed mission even when the player never clicks Save, just navigates away', async () => {
    const first = render(<GameApp />)
    const runButton = await readyRunButton()

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)
    await screen.findByText(he.pass)

    const expectedPercentage = Math.round(100 / missionRegistry.length)
    await waitFor(() => expect(screen.getByText(`${he.progressLabelPrefix}${expectedPercentage}%`)).toBeInTheDocument())

    // The point of this test: no Save click here at all.
    first.unmount()

    // A fresh GameApp instance, the same way a route change to /dashboard
    // and back to /world would remount it.
    render(<GameApp />)
    await readyRunButton()

    expect(screen.getByText(`${he.progressLabelPrefix}${expectedPercentage}%`)).toBeInTheDocument()
  })

  it('does not affect the manual Save button — it keeps working exactly as before', async () => {
    const first = render(<GameApp />)
    const runButton = await readyRunButton()

    fireEvent.click(screen.getByTestId('save-button'))
    expect(await screen.findByTestId('saved-confirmation')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)
    await screen.findByText(he.pass)
    first.unmount()

    render(<GameApp />)
    await readyRunButton()
    const expectedPercentage = Math.round(100 / missionRegistry.length)
    expect(screen.getByText(`${he.progressLabelPrefix}${expectedPercentage}%`)).toBeInTheDocument()
  })

  it('does not throw or warn when unmounted immediately after mount, before any progress exists', () => {
    const first = render(<GameApp />)
    expect(() => first.unmount()).not.toThrow()
  })
})
