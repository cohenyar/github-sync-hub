import { describe, expect, it } from 'vitest'
import type { GameCampaign } from '../../campaign'
import type { PlayerProgress } from '../../progression'
import type { UnlockRule } from '../types'
import { evaluateUnlocks, getLockedContent, getUnlockedContent, isUnlocked } from './unlockEngine'

const campaign: GameCampaign = {
  id: 'campaign-1',
  title: 'Campaign',
  missions: [
    { order: 1, missionId: 'a' },
    { order: 2, missionId: 'b' },
  ],
}

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

describe('rule evaluation', () => {
  it('unlocks a target whose single condition passes', () => {
    const rules: UnlockRule[] = [{ target: { type: 'mission', id: 'a' }, conditions: [{ kind: 'always' }] }]
    expect(isUnlocked(rules, progress(), campaign, { type: 'mission', id: 'a' })).toBe(true)
  })

  it('locks a target whose condition fails', () => {
    const rules: UnlockRule[] = [
      { target: { type: 'mission', id: 'b' }, conditions: [{ kind: 'missionCompleted', missionId: 'a' }] },
    ]
    expect(isUnlocked(rules, progress(), campaign, { type: 'mission', id: 'b' })).toBe(false)
  })

  it('unlocks once its prerequisite is met', () => {
    const rules: UnlockRule[] = [
      { target: { type: 'mission', id: 'b' }, conditions: [{ kind: 'missionCompleted', missionId: 'a' }] },
    ]
    expect(isUnlocked(rules, progress(['a']), campaign, { type: 'mission', id: 'b' })).toBe(true)
  })
})

describe('multiple conditions', () => {
  const rules: UnlockRule[] = [
    {
      target: { type: 'district', id: 'vault' },
      conditions: [
        { kind: 'missionCompleted', missionId: 'a' },
        { kind: 'progressionPercentage', minPercentage: 100 },
      ],
    },
  ]

  it('is locked when only some conditions pass', () => {
    expect(isUnlocked(rules, progress(['a']), campaign, { type: 'district', id: 'vault' })).toBe(false)
  })

  it('is unlocked only once every condition passes', () => {
    expect(isUnlocked(rules, progress(['a', 'b']), campaign, { type: 'district', id: 'vault' })).toBe(true)
  })

  it('combines multiple rules for the same target with OR semantics', () => {
    const orRules: UnlockRule[] = [
      { target: { type: 'mission', id: 'b' }, conditions: [{ kind: 'missionCompleted', missionId: 'a' }] },
      { target: { type: 'mission', id: 'b' }, conditions: [{ kind: 'progressionPercentage', minPercentage: 100 }] },
    ]
    // Neither rule alone is satisfied by completing only "a", but the first rule is.
    expect(isUnlocked(orRules, progress(['a']), campaign, { type: 'mission', id: 'b' })).toBe(true)
  })
})

describe('empty rules', () => {
  it('evaluateUnlocks returns no results for an empty rule set', () => {
    expect(evaluateUnlocks([], progress(), campaign)).toEqual([])
  })

  it('isUnlocked defaults to false when there are no rules at all', () => {
    expect(isUnlocked([], progress(), campaign, { type: 'mission', id: 'a' })).toBe(false)
  })

  it('getUnlockedContent and getLockedContent are both empty with no rules', () => {
    expect(getUnlockedContent([], progress(), campaign)).toEqual([])
    expect(getLockedContent([], progress(), campaign)).toEqual([])
  })

  it('a rule with no conditions unlocks vacuously', () => {
    const rules: UnlockRule[] = [{ target: { type: 'mission', id: 'a' }, conditions: [] }]
    expect(isUnlocked(rules, progress(), campaign, { type: 'mission', id: 'a' })).toBe(true)
  })
})

describe('invalid targets', () => {
  const rules: UnlockRule[] = [{ target: { type: 'mission', id: 'a' }, conditions: [{ kind: 'always' }] }]

  it('a target with no matching rule is locked by default, not an error', () => {
    expect(() => isUnlocked(rules, progress(), campaign, { type: 'mission', id: 'unknown' })).not.toThrow()
    expect(isUnlocked(rules, progress(), campaign, { type: 'mission', id: 'unknown' })).toBe(false)
  })

  it('a target of a type with no rules at all is locked by default', () => {
    expect(isUnlocked(rules, progress(), campaign, { type: 'npc', id: 'anyone' })).toBe(false)
  })

  it('a rule referencing a mission id that will never exist never unlocks, but never throws', () => {
    const danglingRules: UnlockRule[] = [
      { target: { type: 'mission', id: 'b' }, conditions: [{ kind: 'missionCompleted', missionId: 'ghost' }] },
    ]
    expect(isUnlocked(danglingRules, progress(['a', 'b']), campaign, { type: 'mission', id: 'b' })).toBe(false)
  })
})

describe('getUnlockedContent / getLockedContent', () => {
  const rules: UnlockRule[] = [
    { target: { type: 'mission', id: 'a' }, conditions: [{ kind: 'always' }] },
    { target: { type: 'mission', id: 'b' }, conditions: [{ kind: 'missionCompleted', missionId: 'a' }] },
  ]

  it('splits targets into unlocked and locked', () => {
    expect(getUnlockedContent(rules, progress(), campaign)).toEqual([{ type: 'mission', id: 'a' }])
    expect(getLockedContent(rules, progress(), campaign)).toEqual([{ type: 'mission', id: 'b' }])
  })

  it('moves a target from locked to unlocked once its condition is met', () => {
    expect(getUnlockedContent(rules, progress(['a']), campaign)).toEqual([
      { type: 'mission', id: 'a' },
      { type: 'mission', id: 'b' },
    ])
    expect(getLockedContent(rules, progress(['a']), campaign)).toEqual([])
  })
})

describe('read-only guarantee', () => {
  it('never mutates the progress object passed in', () => {
    const rules: UnlockRule[] = [{ target: { type: 'mission', id: 'a' }, conditions: [{ kind: 'always' }] }]
    const p = progress(['a'])
    const snapshot = JSON.parse(JSON.stringify(p))

    evaluateUnlocks(rules, p, campaign)
    isUnlocked(rules, p, campaign, { type: 'mission', id: 'a' })
    getUnlockedContent(rules, p, campaign)
    getLockedContent(rules, p, campaign)

    expect(p).toEqual(snapshot)
  })
})
