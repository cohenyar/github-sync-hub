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

describe('Revisiting an already-completed mission', () => {
  it('shows Status: Completed immediately, never Status: In Progress', async () => {
    render(<GameApp />)
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

  it('still allows re-running the reference query on a revisited completed mission', async () => {
    render(<GameApp />)
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
