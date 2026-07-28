// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { he } from '../i18n'
import { BootSequence } from './BootSequence'

// Each line's timeout is only (re-)scheduled from a useEffect that runs
// after the *previous* line's setState commits, so a single big
// vi.advanceTimersByTimeAsync jump can't reliably cascade through more than
// one link of that chain at a time. Advancing exactly one line-duration per
// call — each its own awaited step — keeps every step to a single
// timer-fires-then-effect-reschedules cycle, which is reliable.
async function advanceOneLine(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

const LOG_LINE_MS = 1600
const ODIN_LINE_MS = 3200

async function advanceThroughAllLines() {
  for (let i = 0; i < 5; i += 1) {
    await advanceOneLine(LOG_LINE_MS)
  }
  await advanceOneLine(ODIN_LINE_MS)
}

describe('BootSequence', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the boot sequence root and the Skip action immediately', () => {
    render(<BootSequence onDone={vi.fn()} />)
    expect(screen.getByTestId('boot-sequence')).toBeInTheDocument()
    expect(screen.getByTestId('boot-sequence-skip-button')).toBeInTheDocument()
  })

  it('shows only the first log line at first, in Hebrew', () => {
    render(<BootSequence onDone={vi.fn()} />)
    expect(screen.getByText(he.bootLogInitializing)).toBeInTheDocument()
    expect(screen.queryByText(he.bootLogConnectingAi)).not.toBeInTheDocument()
  })

  it('reveals each line in order over time, ending with the Odin introduction', async () => {
    render(<BootSequence onDone={vi.fn()} />)

    await advanceOneLine(LOG_LINE_MS)
    expect(screen.getByText(he.bootLogConnectingAi)).toBeInTheDocument()

    await advanceOneLine(LOG_LINE_MS)
    await advanceOneLine(LOG_LINE_MS)
    await advanceOneLine(LOG_LINE_MS)
    expect(screen.getByText(he.bootLogConnectionEstablished)).toBeInTheDocument()

    await advanceOneLine(LOG_LINE_MS)
    expect(screen.getByText(he.bootOdinIntro)).toBeInTheDocument()
    expect(screen.getByText('Odin')).toBeInTheDocument()
  })

  it('calls onDone exactly once when the sequence finishes naturally, within the 10-15s budget', async () => {
    const onDone = vi.fn()
    render(<BootSequence onDone={onDone} />)

    // 5 log lines * 1600ms + the Odin line's own 3200ms display = 11200ms —
    // comfortably inside the required 10-15s window.
    await advanceThroughAllLines()
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('Skip calls onDone immediately, without waiting for any timer', async () => {
    const onDone = vi.fn()
    render(<BootSequence onDone={onDone} />)

    act(() => {
      screen.getByTestId('boot-sequence-skip-button').click()
    })
    expect(onDone).toHaveBeenCalledTimes(1)

    // Letting time pass afterward must not call it again.
    await advanceOneLine(20000)
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('never calls onDone twice even if natural completion and a late Skip race', async () => {
    const onDone = vi.fn()
    render(<BootSequence onDone={onDone} />)

    await advanceThroughAllLines()
    expect(onDone).toHaveBeenCalledTimes(1)

    act(() => {
      screen.getByTestId('boot-sequence-skip-button').click()
    })
    expect(onDone).toHaveBeenCalledTimes(1)
  })
})
