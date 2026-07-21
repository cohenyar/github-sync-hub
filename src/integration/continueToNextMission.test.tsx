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
  const runButton = await screen.findByRole('button', { name: he.run })
  await waitFor(() => expect(runButton).toBeEnabled())
  return runButton
}

describe('The Continue to Next Mission CTA', () => {
  it('is absent before a mission completes, then loads the next mission when clicked', async () => {
    render(<GameApp />)
    const runButton = await readyRunButton()

    expect(
      screen.queryByRole('button', { name: new RegExp(`^${he.continueToPrefix}`) }),
    ).not.toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)
    await screen.findByText(he.pass)

    const continueButton = await screen.findByRole('button', { name: `${he.continueToPrefix}קשרי מחוז` })
    fireEvent.click(continueButton)

    // The SQL console reloads with District Ties' own setup, and the
    // Mission panel now reflects it as the active mission.
    await readyRunButton()
    expect(screen.getByRole('heading', { name: 'קשרי מחוז' })).toBeInTheDocument()
  })
})
