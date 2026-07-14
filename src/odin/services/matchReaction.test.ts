import { describe, expect, it } from 'vitest'
import type { GameEvent } from '../../events'
import type { OdinReaction } from '../types'
import { matchReaction, resolveMessage } from './matchReaction'

const reactions: OdinReaction[] = [
  { id: 'mission-completed-generic', trigger: { event: 'MissionCompleted' }, message: 'generic mission done' },
  {
    id: 'first-contact-completed',
    trigger: { event: 'MissionCompleted', missionId: 'first-contact' },
    message: 'first contact done',
  },
  { id: 'content-unlocked-generic', trigger: { event: 'ContentUnlocked' }, message: 'something unlocked' },
  {
    id: 'district-ties-unlocked',
    trigger: { event: 'ContentUnlocked', targetType: 'mission', targetId: 'district-ties' },
    message: 'district ties unlocked',
  },
  { id: 'campaign-completed', trigger: { event: 'CampaignCompleted', campaignId: 'meridian-campaign' }, message: 'done' },
  { id: 'world-changed', trigger: { event: 'WorldStateChanged' }, message: 'world changed' },
  {
    id: 'query-failed-sql-error',
    trigger: { event: 'QueryFailed', reason: 'sql-error' },
    message: 'sql error',
  },
  {
    id: 'query-failed-mismatch-first-contact',
    trigger: { event: 'QueryFailed', reason: 'mismatch', missionId: 'first-contact' },
    message: 'mismatch on first contact specifically',
  },
]

describe('matchReaction — prefers specific triggers over generic ones', () => {
  it('picks the mission-specific reaction over the generic one for a matching mission id', () => {
    const event: GameEvent = { type: 'MissionCompleted', missionId: 'first-contact' }
    expect(matchReaction(reactions, event)?.id).toBe('first-contact-completed')
  })

  it('falls back to the generic reaction for a different mission id', () => {
    const event: GameEvent = { type: 'MissionCompleted', missionId: 'some-other-mission' }
    expect(matchReaction(reactions, event)?.id).toBe('mission-completed-generic')
  })

  it('picks the target-specific ContentUnlocked reaction over the generic one', () => {
    const event: GameEvent = { type: 'ContentUnlocked', target: { type: 'mission', id: 'district-ties' } }
    expect(matchReaction(reactions, event)?.id).toBe('district-ties-unlocked')
  })

  it('falls back to the generic ContentUnlocked reaction for a different target', () => {
    const event: GameEvent = { type: 'ContentUnlocked', target: { type: 'district', id: 'north' } }
    expect(matchReaction(reactions, event)?.id).toBe('content-unlocked-generic')
  })

  it('matches a QueryFailed reaction by reason alone', () => {
    const event: GameEvent = { type: 'QueryFailed', missionId: 'district-ties', reason: 'sql-error' }
    expect(matchReaction(reactions, event)?.id).toBe('query-failed-sql-error')
  })

  it('prefers the mission-specific QueryFailed reaction over the reason-only one', () => {
    const event: GameEvent = { type: 'QueryFailed', missionId: 'first-contact', reason: 'mismatch' }
    expect(matchReaction(reactions, event)?.id).toBe('query-failed-mismatch-first-contact')
  })

  it('has no QueryFailed match when neither reason nor mission id line up', () => {
    const event: GameEvent = { type: 'QueryFailed', missionId: 'district-ties', reason: 'mismatch' }
    expect(matchReaction(reactions, event)).toBeUndefined()
  })
})

describe('matchReaction — no match', () => {
  it('returns undefined when no reaction targets the event type at all', () => {
    const event: GameEvent = { type: 'CampaignCompleted', campaignId: 'other-campaign' }
    // campaignId does not match the only CampaignCompleted reaction's filter
    expect(matchReaction(reactions, event)).toBeUndefined()
  })

  it('returns undefined for an empty reaction list', () => {
    const event: GameEvent = { type: 'MissionStarted', missionId: 'first-contact' }
    expect(matchReaction([], event)).toBeUndefined()
  })
})

describe('resolveMessage', () => {
  it('returns a static string message as-is', () => {
    const reaction: OdinReaction = { id: 'x', trigger: { event: 'WorldStateChanged' }, message: 'hello' }
    expect(resolveMessage(reaction, { type: 'WorldStateChanged', world: { turn: 0, districts: {} } })).toBe('hello')
  })

  it('invokes a function message with the matched event', () => {
    const reaction: OdinReaction = {
      id: 'x',
      trigger: { event: 'MissionCompleted' },
      message: (event) => (event.type === 'MissionCompleted' ? `done: ${event.missionId}` : 'n/a'),
    }
    expect(resolveMessage(reaction, { type: 'MissionCompleted', missionId: 'first-contact' })).toBe(
      'done: first-contact',
    )
  })
})
