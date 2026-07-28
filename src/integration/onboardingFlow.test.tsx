// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import GameApp from '../GameApp'
import { clearOnboardingFlag, hasCompletedOnboarding, markOnboardingComplete } from '../onboarding'

vi.mock('../db/database', async () => {
  const { createTestDatabase } = await import('../verifier/testDb')
  return { createDatabase: createTestDatabase }
})

const LOG_LINE_MS = 1600
const ODIN_LINE_MS = 3200

async function advanceOneLine(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

async function advanceThroughAllLines() {
  for (let i = 0; i < 5; i += 1) {
    await advanceOneLine(LOG_LINE_MS)
  }
  await advanceOneLine(ODIN_LINE_MS)
}

beforeEach(() => {
  // Overrides src/test/setup.ts's global default (every other test in this
  // suite wants a returning player) — these tests are specifically about
  // the first-time, not-yet-onboarded path.
  clearOnboardingFlag()
})

describe('Onboarding: first-time player', () => {
  it('shows the boot sequence on first mount, not the World Scene or classic dashboard', () => {
    render(<GameApp />)

    expect(screen.getByTestId('boot-sequence')).toBeInTheDocument()
    expect(screen.queryByTestId('world-scene-3d')).not.toBeInTheDocument()
    expect(screen.queryByTestId('toggle-world-scene-button')).not.toBeInTheDocument()
  })

  it('Skip reveals the World Scene immediately and marks onboarding complete', () => {
    render(<GameApp />)

    fireEvent.click(screen.getByTestId('boot-sequence-skip-button'))

    expect(screen.queryByTestId('boot-sequence')).not.toBeInTheDocument()
    expect(screen.getByTestId('world-scene-3d')).toBeInTheDocument()
    expect(hasCompletedOnboarding()).toBe(true)
  })

  it('finishing the sequence naturally (no Skip) reaches the same end state', async () => {
    vi.useFakeTimers()
    render(<GameApp />)

    await advanceThroughAllLines()

    expect(screen.queryByTestId('boot-sequence')).not.toBeInTheDocument()
    expect(screen.getByTestId('world-scene-3d')).toBeInTheDocument()
    expect(hasCompletedOnboarding()).toBe(true)
    vi.useRealTimers()
  })

  it('greets the player with a one-time Odin narration once the World Scene is reached', () => {
    render(<GameApp />)
    fireEvent.click(screen.getByTestId('boot-sequence-skip-button'))

    expect(screen.getByTestId('odin-presence')).toHaveTextContent('ברוך הבא למרידיאן')
  })

  it('never replays the world-entry greeting when toggling between the World Scene and classic dashboard afterward', () => {
    render(<GameApp />)
    fireEvent.click(screen.getByTestId('boot-sequence-skip-button'))
    expect(screen.getByTestId('odin-presence')).toHaveTextContent('ברוך הבא למרידיאן')

    // Toggle back and forth several times — WorldEntered must never publish
    // again, so Odin's narration history never grows past its one entry.
    fireEvent.click(screen.getByTestId('toggle-world-scene-button'))
    fireEvent.click(screen.getByTestId('toggle-world-scene-button'))
    fireEvent.click(screen.getByTestId('toggle-world-scene-button'))

    // The classic dashboard's OdinPanel only renders a "history" list once
    // more than one narration entry exists — its absence here proves the
    // greeting is still the *only* entry Odin has ever narrated.
    expect(screen.getByTestId('odin-latest-message')).toHaveTextContent('ברוך הבא למרידיאן')
    expect(screen.queryByTestId('odin-history')).not.toBeInTheDocument()
  })

  it('does not survive React remounting the component fresh (a real unmount/remount, not just a toggle)', () => {
    const first = render(<GameApp />)
    fireEvent.click(screen.getByTestId('boot-sequence-skip-button'))
    expect(hasCompletedOnboarding()).toBe(true)
    first.unmount()

    // A fresh mount now finds the flag already set (this is the returning-
    // player path) and must not show the boot sequence or re-greet.
    render(<GameApp />)
    expect(screen.queryByTestId('boot-sequence')).not.toBeInTheDocument()
    expect(screen.getByTestId('world-scene-3d')).toBeInTheDocument()
    expect(screen.queryByTestId('odin-presence')).not.toBeInTheDocument()
  })
})

describe('Onboarding: returning player', () => {
  beforeEach(() => {
    markOnboardingComplete()
  })

  it('never shows the boot sequence; the World Scene is immediately visible', () => {
    render(<GameApp />)

    expect(screen.queryByTestId('boot-sequence')).not.toBeInTheDocument()
    expect(screen.getByTestId('world-scene-3d')).toBeInTheDocument()
  })

  it('does not narrate the first-time world-entry greeting', () => {
    render(<GameApp />)

    expect(screen.queryByTestId('odin-presence')).not.toBeInTheDocument()
  })
})

describe('Onboarding: New Game reset', () => {
  it('clears the onboarding flag, but does not reopen the boot sequence within the same mounted session', () => {
    markOnboardingComplete()
    render(<GameApp />)
    expect(screen.getByTestId('world-scene-3d')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('toggle-world-scene-button'))
    fireEvent.click(screen.getByTestId('new-game-button'))
    fireEvent.click(screen.getByTestId('confirm-reset-yes-button'))

    expect(hasCompletedOnboarding()).toBe(false)
    expect(screen.queryByTestId('boot-sequence')).not.toBeInTheDocument()
  })
})
