// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { gameEventBus } from '../events'
import type { GameEvent } from '../events'
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

// gameEventBus is a shared singleton; unsubscribe every spy after each test
// so events published by one test can't leak into the next.
const activeHandlers: Array<(event: GameEvent) => void> = []
function watch(): GameEvent[] {
  const events: GameEvent[] = []
  const handler = (event: GameEvent) => events.push(event)
  for (const type of [
    'MissionStarted',
    'MissionCompleted',
    'WorldStateChanged',
    'CampaignCompleted',
    'ContentUnlocked',
  ] as const) {
    gameEventBus.subscribe(type, handler)
  }
  activeHandlers.push(handler)
  return events
}

afterEach(() => {
  for (const handler of activeHandlers.splice(0)) {
    gameEventBus.unsubscribe(handler)
  }
})

describe('The event bus publishes real gameplay events end to end', () => {
  it('publishes MissionStarted once the mission database is ready', async () => {
    const events = watch()
    renderGameApp()
    await readyRunButton()

    await waitFor(() => {
      const started = events.filter((e) => e.type === 'MissionStarted')
      expect(started).toEqual([{ type: 'MissionStarted', missionId: 'first-contact' }])
    })
  })

  it('publishes WorldStateChanged, MissionCompleted, and ContentUnlocked (but not CampaignCompleted) when only the first of two missions passes', async () => {
    const events = watch()
    renderGameApp()
    const runButton = await readyRunButton()

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(runButton)

    await screen.findByText(he.pass)

    // ContentUnlocked is published from a useEffect keyed off playerProgress
    // (Step 21), so it can land on a later tick than the synchronous
    // WorldStateChanged/MissionCompleted pair. Completing First Contact
    // unlocks both the District Ties mission and the east-broker NPC
    // (Step 26), so two ContentUnlocked events fire.
    await waitFor(() => {
      const relevant = events.filter((e) => e.type !== 'MissionStarted')
      expect(relevant.map((e) => e.type)).toEqual([
        'WorldStateChanged',
        'MissionCompleted',
        'ContentUnlocked',
        'ContentUnlocked',
      ])
    })

    const relevant = events.filter((e) => e.type !== 'MissionStarted')
    expect(relevant[1]).toEqual({ type: 'MissionCompleted', missionId: 'first-contact' })
    expect(relevant[2]).toEqual({
      type: 'ContentUnlocked',
      target: { type: 'mission', id: 'district-ties' },
    })
    expect(relevant[3]).toEqual({
      type: 'ContentUnlocked',
      target: { type: 'npc', id: 'east-broker' },
    })

    // The campaign has a second mission now, so completing only the first
    // must not fire CampaignCompleted.
    expect(events.some((e) => e.type === 'CampaignCompleted')).toBe(false)

    // Progression still updates via the event bus instead of a direct call —
    // same observable outcome as before the event system existed.
    expect(screen.getByText(`${he.contentLabelPrefix}${he.completed}`)).toBeInTheDocument()
  })

  it('does not publish MissionCompleted, CampaignCompleted, or ContentUnlocked for a failing query', async () => {
    const events = watch()
    renderGameApp()
    const runButton = await readyRunButton()

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens WHERE id = 1;' },
    })
    fireEvent.click(runButton)

    await screen.findByText(he.fail)

    expect(events.some((e) => e.type === 'MissionCompleted')).toBe(false)
    expect(events.some((e) => e.type === 'CampaignCompleted')).toBe(false)
    expect(events.some((e) => e.type === 'WorldStateChanged')).toBe(false)
    expect(events.some((e) => e.type === 'ContentUnlocked')).toBe(false)
  })
})
