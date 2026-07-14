import { describe, expect, it } from 'vitest'
import type { GameCampaign } from '../../campaign'
import type { PlayerProgress } from '../../progression'
import type { UnlockRule } from '../../unlocks'
import { createEventBus } from '../bus/eventBus'
import { createUnlockReactionHandler } from './createUnlockReactionHandler'

const campaign: GameCampaign = {
  id: 'test-campaign',
  title: 'Test Campaign',
  missions: [
    { order: 1, missionId: 'a' },
    { order: 2, missionId: 'b' },
  ],
}

const rules: UnlockRule[] = [
  { target: { type: 'mission', id: 'a' }, conditions: [{ kind: 'always' }] },
  { target: { type: 'mission', id: 'b' }, conditions: [{ kind: 'missionCompleted', missionId: 'a' }] },
]

function progress(completedMissionIds: string[] = []): PlayerProgress {
  return {
    completedMissionIds,
    completions: completedMissionIds.map((missionId, index) => ({ missionId, sequence: index + 1 })),
    unlockState: { unlockedMissionIds: [] },
    campaignProgress: {
      campaignId: campaign.id,
      currentMissionId: null,
      isComplete: completedMissionIds.length === campaign.missions.length,
    },
  }
}

function makeProgressRef(initial: PlayerProgress) {
  let current = initial
  return { get: () => current, set: (next: PlayerProgress) => (current = next) }
}

describe('createUnlockReactionHandler', () => {
  it('publishes nothing when the unlocked set has not changed', () => {
    const bus = createEventBus()
    const state = makeProgressRef(progress())
    const received: unknown[] = []
    bus.subscribe('ContentUnlocked', (event) => received.push(event))

    const handler = createUnlockReactionHandler(bus, () => state.get(), rules, campaign)
    handler()

    expect(received).toEqual([])
  })

  it('publishes ContentUnlocked for a mission that newly became unlocked', () => {
    const bus = createEventBus()
    const state = makeProgressRef(progress())
    const received: unknown[] = []
    bus.subscribe('ContentUnlocked', (event) => received.push(event))

    const handler = createUnlockReactionHandler(bus, () => state.get(), rules, campaign)
    handler() // baseline: only "a" is unlocked at creation time

    state.set(progress(['a']))
    handler()

    expect(received).toEqual([{ type: 'ContentUnlocked', target: { type: 'mission', id: 'b' } }])
  })

  it('does not re-publish for a target that was already unlocked', () => {
    const bus = createEventBus()
    const state = makeProgressRef(progress())
    const received: unknown[] = []
    bus.subscribe('ContentUnlocked', (event) => received.push(event))

    const handler = createUnlockReactionHandler(bus, () => state.get(), rules, campaign)
    handler() // baseline: only "a" unlocked, nothing new yet

    state.set(progress(['a']))
    handler() // "b" unlocks here
    handler() // calling again with the same progress should not re-publish

    expect(received).toEqual([{ type: 'ContentUnlocked', target: { type: 'mission', id: 'b' } }])
  })

  it('never mutates the progress object it reads', () => {
    const bus = createEventBus()
    const p = progress(['a'])
    const snapshot = JSON.parse(JSON.stringify(p))

    const handler = createUnlockReactionHandler(bus, () => p, rules, campaign)
    handler()

    expect(p).toEqual(snapshot)
  })

  it('defaults to the real rules and campaign, where the single mission is already unlocked', () => {
    const bus = createEventBus()
    const realProgress: PlayerProgress = {
      completedMissionIds: [],
      completions: [],
      unlockState: { unlockedMissionIds: [] },
      campaignProgress: { campaignId: 'meridian-campaign', currentMissionId: 'first-contact', isComplete: false },
    }
    const received: unknown[] = []
    bus.subscribe('ContentUnlocked', (event) => received.push(event))

    // No third/fourth args — exercises the real defaultUnlockRules/defaultCampaign.
    const handler = createUnlockReactionHandler(bus, () => realProgress)
    handler()

    // Real content is all "always" unlocked already, so nothing "newly" unlocks.
    expect(received).toEqual([])
  })
})
