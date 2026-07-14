import { describe, expect, it } from 'vitest'
import type { GameEvent } from '../../events'
import type { OdinReaction } from '../types'
import { applyOdinEvent, createInitialOdinState } from './odinNarrator'

const reactions: OdinReaction[] = [
  { id: 'mission-completed', trigger: { event: 'MissionCompleted' }, message: 'mission done' },
  { id: 'mission-started', trigger: { event: 'MissionStarted' }, message: 'mission started' },
]

describe('createInitialOdinState', () => {
  it('starts with empty history', () => {
    expect(createInitialOdinState()).toEqual({ history: [] })
  })
})

describe('applyOdinEvent', () => {
  it('appends a narration entry when a reaction matches', () => {
    const state = applyOdinEvent(createInitialOdinState(), { type: 'MissionStarted', missionId: 'a' }, reactions)
    expect(state.history).toHaveLength(1)
    expect(state.history[0]).toMatchObject({ message: 'mission started', sequence: 1 })
  })

  it('leaves history unchanged when nothing matches (no spurious reactions)', () => {
    const initial = createInitialOdinState()
    const next = applyOdinEvent(initial, { type: 'CampaignCompleted', campaignId: 'x' }, [])
    expect(next).toBe(initial)
    expect(next.history).toEqual([])
  })

  it('accumulates entries in order across multiple events, with increasing sequence numbers', () => {
    let state = createInitialOdinState()
    const events: GameEvent[] = [
      { type: 'MissionStarted', missionId: 'a' },
      { type: 'MissionCompleted', missionId: 'a' },
    ]
    for (const event of events) {
      state = applyOdinEvent(state, event, reactions)
    }

    expect(state.history.map((entry) => entry.message)).toEqual(['mission started', 'mission done'])
    expect(state.history.map((entry) => entry.sequence)).toEqual([1, 2])
  })

  it('does not add a duplicate entry for an event with no matching reaction, even after prior matches', () => {
    let state = applyOdinEvent(createInitialOdinState(), { type: 'MissionStarted', missionId: 'a' }, reactions)
    const beforeLength = state.history.length

    state = applyOdinEvent(state, { type: 'ContentUnlocked', target: { type: 'mission', id: 'x' } }, reactions)

    expect(state.history).toHaveLength(beforeLength)
  })
})
