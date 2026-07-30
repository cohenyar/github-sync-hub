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

const percentPerMission = Math.round(100 / missionRegistry.length)

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

describe('Progression tracks mission completion end to end', () => {
  it('starts at 0% with the mission available', async () => {
    renderGameApp()
    await readyRunButton()

    expect(screen.getByText(`${he.progressLabelPrefix}0%`)).toBeInTheDocument()
    expect(screen.getByText(`${he.contentLabelPrefix}${he.available}`)).toBeInTheDocument()
  })

  it('advances by one mission worth of progress once the first mission passes', async () => {
    renderGameApp()
    const runButton = await readyRunButton()

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)

    await screen.findByText(he.pass)
    expect(screen.getByText(`${he.progressLabelPrefix}${percentPerMission}%`)).toBeInTheDocument()
    expect(screen.getByText(`${he.contentLabelPrefix}${he.completed}`)).toBeInTheDocument()
  })

  it('does not advance progress on a failing query', async () => {
    renderGameApp()
    const runButton = await readyRunButton()

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens WHERE id = 1;' },
    })
    fireEvent.click(runButton)

    await screen.findByText(he.fail)
    expect(screen.getByText(`${he.progressLabelPrefix}0%`)).toBeInTheDocument()
    expect(screen.getByText(`${he.contentLabelPrefix}${he.available}`)).toBeInTheDocument()
  })
})
