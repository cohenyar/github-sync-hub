// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Save confirmation', () => {
  it('shows "Saved." after clicking Save, then hides it again after a few seconds', async () => {
    render(<GameApp />)
    await readyRunButton()

    expect(screen.queryByTestId('saved-confirmation')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('save-button'))
    expect(screen.getByTestId('saved-confirmation')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(screen.queryByTestId('saved-confirmation')).not.toBeInTheDocument()
  })
})
