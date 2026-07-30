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
  {
    id: 'lesson-completed-generic',
    trigger: { event: 'LessonCompleted' },
    message: 'a lesson was completed',
  },
  {
    id: 'lesson-math-completed',
    trigger: { event: 'LessonCompleted', lessonId: 'lesson:math-001' },
    message: 'math lesson completed',
  },
  {
    id: 'lesson-failed-generic',
    trigger: { event: 'LessonFailed' },
    message: 'a lesson attempt failed',
  },
  {
    id: 'archive-page-found-generic',
    trigger: { event: 'ArchivePageFound' },
    message: 'something worth keeping',
  },
  {
    id: 'archive-page-trade-count-found',
    trigger: { event: 'ArchivePageFound', pageId: 'archive-page:trade-count' },
    message: 'the trade count page specifically',
  },
  {
    id: 'session-resumed',
    trigger: { event: 'SessionResumed' },
    message: 'welcome back',
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

  it('picks the lesson-specific LessonCompleted reaction over the generic one', () => {
    const event: GameEvent = { type: 'LessonCompleted', lessonId: 'lesson:math-001' }
    expect(matchReaction(reactions, event)?.id).toBe('lesson-math-completed')
  })

  it('falls back to the generic LessonCompleted reaction for a different lesson id', () => {
    const event: GameEvent = { type: 'LessonCompleted', lessonId: 'lesson:english-001' }
    expect(matchReaction(reactions, event)?.id).toBe('lesson-completed-generic')
  })

  it('matches LessonFailed as its own event, never falling back to QueryFailed reactions', () => {
    const event: GameEvent = { type: 'LessonFailed', lessonId: 'lesson:math-001' }
    expect(matchReaction(reactions, event)?.id).toBe('lesson-failed-generic')
  })

  it('picks the page-specific ArchivePageFound reaction over the generic one (Meridian 1.3)', () => {
    const event: GameEvent = { type: 'ArchivePageFound', pageId: 'archive-page:trade-count' }
    expect(matchReaction(reactions, event)?.id).toBe('archive-page-trade-count-found')
  })

  it('falls back to the generic ArchivePageFound reaction for a different page id (Meridian 1.3)', () => {
    const event: GameEvent = { type: 'ArchivePageFound', pageId: 'archive-page:lost-and-found' }
    expect(matchReaction(reactions, event)?.id).toBe('archive-page-found-generic')
  })

  it('matches SessionResumed as its own event (Meridian 1.3)', () => {
    const event: GameEvent = { type: 'SessionResumed' }
    expect(matchReaction(reactions, event)?.id).toBe('session-resumed')
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
