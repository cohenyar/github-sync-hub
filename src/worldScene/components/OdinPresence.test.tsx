// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { OdinNarrationEntry } from '../../odin'
import { OdinPresence } from './OdinPresence'

function entry(id: string, message: string): OdinNarrationEntry {
  return { id, message, event: { type: 'MissionStarted', missionId: 'first-contact' }, sequence: 1 }
}

describe('OdinPresence', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when there is no narration yet', () => {
    render(<OdinPresence latestEntry={null} />)
    expect(screen.queryByTestId('odin-presence')).not.toBeInTheDocument()
  })

  it("shows Odin's latest message", () => {
    render(<OdinPresence latestEntry={entry('1', 'A new query awaits. I am listening.')} />)
    expect(screen.getByTestId('odin-presence')).toHaveTextContent('A new query awaits. I am listening.')
  })

  it('updates to a new message when a new entry arrives', () => {
    const { rerender } = render(<OdinPresence latestEntry={entry('1', 'First line.')} />)
    rerender(<OdinPresence latestEntry={entry('2', 'Second line.')} />)
    expect(screen.getByTestId('odin-presence')).toHaveTextContent('Second line.')
  })

  it('does not restart the display when the same entry id is passed again', () => {
    const { rerender } = render(<OdinPresence latestEntry={entry('1', 'First line.')} />)
    act(() => {
      vi.advanceTimersByTime(4000)
    })
    rerender(<OdinPresence latestEntry={entry('1', 'First line.')} />)
    // Already 4s into its 4.5s display window — passing the same id again
    // must not reset that timer back to zero.
    act(() => {
      vi.advanceTimersByTime(800)
    })
    expect(screen.queryByTestId('odin-presence')).not.toBeInTheDocument()
  })

  it('fades out and removes itself after the display duration elapses', () => {
    render(<OdinPresence latestEntry={entry('1', 'First line.')} />)
    expect(screen.getByTestId('odin-presence')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(4500)
    })
    expect(screen.getByTestId('odin-presence')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(screen.queryByTestId('odin-presence')).not.toBeInTheDocument()
  })
})
