import { describe, expect, it } from 'vitest'
import { matchReaction } from '../services/matchReaction'
import { defaultOdinReactions } from './defaultOdinReactions'

function find(id: string) {
  const reaction = defaultOdinReactions.find((r) => r.id === id)
  if (!reaction) throw new Error(`missing reaction: ${id}`)
  return reaction
}

describe('defaultOdinReactions', () => {
  it('comments on First Contact completing specifically', () => {
    const reaction = find('first-contact-completed')
    expect(reaction.trigger).toEqual({ event: 'MissionCompleted', missionId: 'first-contact' })
    expect(typeof reaction.message).toBe('string')
  })

  it('hints at District Ties unlocking specifically', () => {
    const reaction = find('district-ties-unlocked')
    expect(reaction.trigger).toEqual({ event: 'ContentUnlocked', targetType: 'mission', targetId: 'district-ties' })
  })

  it('reacts to South Stability unlocking and completing specifically', () => {
    expect(find('south-stability-unlocked').trigger).toEqual({
      event: 'ContentUnlocked',
      targetType: 'mission',
      targetId: 'south-stability',
    })
    expect(find('south-stability-completed').trigger).toEqual({
      event: 'MissionCompleted',
      missionId: 'south-stability',
    })
  })

  it('reacts to Full Signal unlocking and completing specifically', () => {
    expect(find('full-signal-unlocked').trigger).toEqual({
      event: 'ContentUnlocked',
      targetType: 'mission',
      targetId: 'full-signal',
    })
    expect(find('full-signal-completed').trigger).toEqual({
      event: 'MissionCompleted',
      missionId: 'full-signal',
    })
  })

  it('reacts to Linked Records unlocking and completing specifically', () => {
    expect(find('linked-records-unlocked').trigger).toEqual({
      event: 'ContentUnlocked',
      targetType: 'mission',
      targetId: 'linked-records',
    })
    expect(find('linked-records-completed').trigger).toEqual({
      event: 'MissionCompleted',
      missionId: 'linked-records',
    })
  })

  it("does not claim Full Signal is the last mission, since Linked Records now follows it", () => {
    expect(find('full-signal-unlocked').message).not.toMatch(/last|one query remains|at last/i)
  })

  it('reacts to Priority Signal unlocking and completing specifically', () => {
    expect(find('priority-signal-unlocked').trigger).toEqual({
      event: 'ContentUnlocked',
      targetType: 'mission',
      targetId: 'priority-signal',
    })
    expect(find('priority-signal-completed').trigger).toEqual({
      event: 'MissionCompleted',
      missionId: 'priority-signal',
    })
  })

  it('does not claim Linked Records is the last mission, since Priority Signal now follows it', () => {
    expect(find('linked-records-unlocked').message).not.toMatch(/last|one connection remains|whole/i)
    expect(find('linked-records-completed').message).not.toMatch(/last|one connection remains|is whole/i)
  })

  it('reacts to the two new NPCs unlocking specifically', () => {
    expect(find('south-engineer-unlocked').trigger).toEqual({
      event: 'ContentUnlocked',
      targetType: 'npc',
      targetId: 'south-engineer',
    })
    expect(find('city-voice-unlocked').trigger).toEqual({
      event: 'ContentUnlocked',
      targetType: 'npc',
      targetId: 'city-voice',
    })
  })

  it('reacts to the progression-percentage-gated NPC unlocking specifically', () => {
    expect(find('north-analyst-unlocked').trigger).toEqual({
      event: 'ContentUnlocked',
      targetType: 'npc',
      targetId: 'north-analyst',
    })
  })

  it('has generic fallbacks for MissionCompleted and ContentUnlocked', () => {
    expect(find('mission-completed-generic').trigger).toEqual({ event: 'MissionCompleted' })
    expect(find('content-unlocked-generic').trigger).toEqual({ event: 'ContentUnlocked' })
  })

  it('reacts to a mission starting and a campaign completing', () => {
    expect(find('mission-started').trigger).toEqual({ event: 'MissionStarted' })
    expect(find('campaign-completed').trigger).toEqual({ event: 'CampaignCompleted' })
  })

  it('reacts to a query failing, distinguishing a SQL error from a wrong-result mismatch', () => {
    expect(find('query-failed-sql-error').trigger).toEqual({ event: 'QueryFailed', reason: 'sql-error' })
    expect(find('query-failed-mismatch').trigger).toEqual({ event: 'QueryFailed', reason: 'mismatch' })
  })

  it('has a mission-specific mismatch hint for each mission after First Contact', () => {
    const missionIds = ['district-ties', 'south-stability', 'full-signal', 'linked-records', 'priority-signal']
    for (const missionId of missionIds) {
      const reaction = find(`${missionId}-failed-mismatch`)
      expect(reaction.trigger).toEqual({ event: 'QueryFailed', missionId, reason: 'mismatch' })
    }
  })

  it('does not add a mission-specific mismatch reaction for First Contact', () => {
    expect(defaultOdinReactions.find((r) => r.id === 'first-contact-failed-mismatch')).toBeUndefined()
  })

  it('does not add any mission-specific sql-error reactions', () => {
    const hasMissionSpecificSqlError = defaultOdinReactions.some(
      (r) => r.trigger.event === 'QueryFailed' && r.trigger.reason === 'sql-error' && r.trigger.missionId !== undefined,
    )
    expect(hasMissionSpecificSqlError).toBe(false)
  })

  it('picks the mission-specific mismatch hint over the generic one for a mission that has one', () => {
    const reaction = matchReaction(defaultOdinReactions, {
      type: 'QueryFailed',
      missionId: 'linked-records',
      reason: 'mismatch',
    })
    expect(reaction?.id).toBe('linked-records-failed-mismatch')
  })

  it('falls back to the generic mismatch hint for First Contact, which has no specific one', () => {
    const reaction = matchReaction(defaultOdinReactions, {
      type: 'QueryFailed',
      missionId: 'first-contact',
      reason: 'mismatch',
    })
    expect(reaction?.id).toBe('query-failed-mismatch')
  })

  it('still falls back to the generic sql-error hint for a mission with a specific mismatch reaction', () => {
    const reaction = matchReaction(defaultOdinReactions, {
      type: 'QueryFailed',
      missionId: 'linked-records',
      reason: 'sql-error',
    })
    expect(reaction?.id).toBe('query-failed-sql-error')
  })

  it('reacts to each of the two Batch 3A.4B lessons completing specifically, as a distinct event from MissionCompleted', () => {
    expect(find('lesson-math-completed').trigger).toEqual({ event: 'LessonCompleted', lessonId: 'lesson:math-001' })
    expect(find('lesson-english-completed').trigger).toEqual({
      event: 'LessonCompleted',
      lessonId: 'lesson:english-001',
    })
    // A lesson id never fires the MissionCompleted-keyed reactions above.
    expect(
      matchReaction(defaultOdinReactions, { type: 'MissionCompleted', missionId: 'lesson:math-001' })?.id,
    ).toBe('mission-completed-generic')
  })

  it('has a generic LessonFailed fallback, distinct from QueryFailed', () => {
    expect(find('lesson-failed-generic').trigger).toEqual({ event: 'LessonFailed' })
  })

  it('picks the lesson-specific completion reaction over nothing else matching', () => {
    const mathReaction = matchReaction(defaultOdinReactions, { type: 'LessonCompleted', lessonId: 'lesson:math-001' })
    expect(mathReaction?.id).toBe('lesson-math-completed')

    const englishReaction = matchReaction(defaultOdinReactions, {
      type: 'LessonCompleted',
      lessonId: 'lesson:english-001',
    })
    expect(englishReaction?.id).toBe('lesson-english-completed')
  })

  it('reacts to WorldEntered with a one-time welcome/greeting', () => {
    const reaction = find('world-entered-greeting')
    expect(reaction.trigger).toEqual({ event: 'WorldEntered' })
    const matched = matchReaction(defaultOdinReactions, { type: 'WorldEntered' })
    expect(matched?.id).toBe('world-entered-greeting')
  })

  it('every reaction has a non-empty id and message', () => {
    for (const reaction of defaultOdinReactions) {
      expect(reaction.id.length).toBeGreaterThan(0)
      if (typeof reaction.message === 'string') {
        expect(reaction.message.length).toBeGreaterThan(0)
      }
    }
  })

  it('reacts to each rewritten lesson with story-specific text, not the old generic "well done" (Meridian 1.3 — Narrative Backbone §07)', () => {
    const mathReaction = find('lesson-math-completed')
    expect(mathReaction.messageHe).not.toContain('סדר הפעולות פתר את התרגיל')
    const englishReaction = find('lesson-english-completed')
    expect(englishReaction.messageHe).not.toContain('כל המילים תורגמו נכון')
  })

  it('reacts to each Archive Page being found specifically, with a generic fallback for any other page (Meridian 1.3)', () => {
    expect(find('archive-page-trade-count-found').trigger).toEqual({
      event: 'ArchivePageFound',
      pageId: 'archive-page:trade-count',
    })
    expect(find('archive-page-lost-and-found-found').trigger).toEqual({
      event: 'ArchivePageFound',
      pageId: 'archive-page:lost-and-found',
    })
    expect(find('archive-page-found-generic').trigger).toEqual({ event: 'ArchivePageFound' })

    const matched = matchReaction(defaultOdinReactions, {
      type: 'ArchivePageFound',
      pageId: 'archive-page:trade-count',
    })
    expect(matched?.id).toBe('archive-page-trade-count-found')

    const fallback = matchReaction(defaultOdinReactions, { type: 'ArchivePageFound', pageId: 'some-future-page' })
    expect(fallback?.id).toBe('archive-page-found-generic')
  })

  it('reacts to a returning player with a one-time welcome-back line, distinct from WorldEntered (Meridian 1.3)', () => {
    const reaction = find('session-resumed')
    expect(reaction.trigger).toEqual({ event: 'SessionResumed' })
    const matched = matchReaction(defaultOdinReactions, { type: 'SessionResumed' })
    expect(matched?.id).toBe('session-resumed')
    expect(reaction.messageHe).not.toBe(find('world-entered-greeting').messageHe)
  })
})
