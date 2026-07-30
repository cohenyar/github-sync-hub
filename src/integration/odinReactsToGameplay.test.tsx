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

describe('Odin reacts to real gameplay end to end', () => {
  it('greets the player once the mission database is ready', async () => {
    renderGameApp()
    await readyRunButton()

    await waitFor(() => {
      expect(screen.getByText('שאילתה חדשה ממתינה. אני מקשיב.')).toBeInTheDocument()
    })
    expect(screen.getByText(he.odinStatusLabel)).toBeInTheDocument()
  })

  it('comments on the restored signal when First Contact passes, then hints at District Ties unlocking', async () => {
    renderGameApp()
    const runButton = await readyRunButton()

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)

    await screen.findByText(he.pass)

    await waitFor(() => {
      expect(screen.getByText('האות יציב כעת. מרידיאן שוב רואה את תושביה.')).toBeInTheDocument()
    })

    // District Ties unlocking follows in the narration history once the
    // unlock-reaction effect catches up to the updated progress.
    await waitFor(() => {
      expect(
        screen.getByText('העיר מתחילה להשיב. אפשר כעת להתחקות אחר קשרי המחוז.'),
      ).toBeInTheDocument()
    })
  })

  it('does not narrate a mission completion for a failing query, but does narrate the failure', async () => {
    renderGameApp()
    const runButton = await readyRunButton()

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens WHERE id = 1;' },
    })
    fireEvent.click(runButton)

    await screen.findByText(he.fail)

    expect(screen.queryByText(/האות יציב/)).not.toBeInTheDocument()
    await waitFor(() => {
      expect(
        screen.getByText('קרוב, אך הרשומות עדיין לא תואמות. הבט שוב במה שהשאילתה מחזירה.'),
      ).toBeInTheDocument()
    })
  })

  it('narrates a SQL error distinctly from a row mismatch', async () => {
    renderGameApp()
    const runButton = await readyRunButton()

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'NOT VALID SQL' },
    })
    fireEvent.click(runButton)

    await screen.findByText(new RegExp(`^${he.sqlErrorPrefix}`))

    await waitFor(() => {
      expect(screen.getByText('לא ניתן היה להריץ את השאילתה. בדוק את התחביר ונסה שוב.')).toBeInTheDocument()
    })
  })

  it('narrates a mission-specific hint for a mismatched query on District Ties, not the generic one', async () => {
    renderGameApp()
    const runButton = await readyRunButton()

    // Pass First Contact to unlock District Ties.
    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)
    await screen.findByText(he.pass)

    fireEvent.click(await screen.findByRole('button', { name: `קשרי מחוז (${he.available})` }))
    await readyRunButton()

    // Wrong district value — a valid query, wrong result.
    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: "SELECT * FROM citizens WHERE district = 'south';" },
    })
    fireEvent.click(screen.getByRole('button', { name: he.run }))

    await screen.findByText(he.fail)

    await waitFor(() => {
      expect(
        screen.getByText('בדוק את ערך המחוז בתנאי ה-WHERE שלך — הוא צריך להתאים בדיוק לצפון.'),
      ).toBeInTheDocument()
    })
    expect(
      screen.queryByText('קרוב, אך הרשומות עדיין לא תואמות. הבט שוב במה שהשאילתה מחזירה.'),
    ).not.toBeInTheDocument()
  })
})
