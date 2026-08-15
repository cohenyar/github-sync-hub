import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress, recordMissionCompletion } from '../../progression'
import {
  getLockedContentIds,
  getMissionContentStatus,
  getUnlockedContentIds,
  getUnlockedNpcIds,
  isContentUnlocked,
} from './unlockSelectors'

describe('backward compatibility with the real campaign', () => {
  it('the first mission is unlocked from the very start', () => {
    const progress = createInitialPlayerProgress()
    expect(isContentUnlocked(progress, { type: 'mission', id: 'first-contact' })).toBe(true)
  })

  it('every real district is unlocked from the start', () => {
    const progress = createInitialPlayerProgress()
    for (const id of ['north', 'south', 'east', 'core']) {
      expect(isContentUnlocked(progress, { type: 'district', id })).toBe(true)
    }
  })

  it('English and Math\'s own first missions are unlocked from the start too — subjects never gate each other (Meridian 2.0)', () => {
    const progress = createInitialPlayerProgress()
    expect(isContentUnlocked(progress, { type: 'mission', id: 'district-ties' })).toBe(true)
    expect(isContentUnlocked(progress, { type: 'mission', id: 'south-stability' })).toBe(true)
  })

  it('History\'s second mission is locked until History\'s own first mission is completed', () => {
    const progress = createInitialPlayerProgress()
    expect(isContentUnlocked(progress, { type: 'mission', id: 'full-signal' })).toBe(false)

    const completed = recordMissionCompletion(progress, 'first-contact')
    expect(isContentUnlocked(completed, { type: 'mission', id: 'full-signal' })).toBe(true)
  })

  it('getUnlockedContentIds includes every subject\'s first mission and all districts; getLockedContentIds includes each subject\'s still-gated second mission', () => {
    const progress = createInitialPlayerProgress()
    const unlocked = getUnlockedContentIds(progress)
    expect(unlocked).toContainEqual({ type: 'mission', id: 'first-contact' })
    expect(unlocked).toContainEqual({ type: 'mission', id: 'district-ties' })
    expect(unlocked).toContainEqual({ type: 'mission', id: 'south-stability' })
    expect(unlocked.length).toBeGreaterThanOrEqual(7) // 3 unlocked first-missions (History/English/Math) + 4 districts

    expect(getLockedContentIds(progress)).toContainEqual({ type: 'mission', id: 'full-signal' })
  })

  it('reports "available" before completion and "completed" after, for the first mission', () => {
    const progress = createInitialPlayerProgress()
    expect(getMissionContentStatus(progress, 'first-contact')).toBe('available')

    const completed = recordMissionCompletion(progress, 'first-contact')
    expect(getMissionContentStatus(completed, 'first-contact')).toBe('completed')
  })

  it('reports "locked" then "available" for History\'s gated second mission', () => {
    const progress = createInitialPlayerProgress()
    expect(getMissionContentStatus(progress, 'full-signal')).toBe('locked')

    const completed = recordMissionCompletion(progress, 'first-contact')
    expect(getMissionContentStatus(completed, 'full-signal')).toBe('available')
  })

  it('reports "locked" for a mission id that is not part of any rule', () => {
    const progress = createInitialPlayerProgress()
    expect(getMissionContentStatus(progress, 'does-not-exist')).toBe('locked')
  })

  it('getUnlockedNpcIds includes always-unlocked NPCs but not the one gated behind First Contact', () => {
    const progress = createInitialPlayerProgress()
    const unlockedNpcIds = getUnlockedNpcIds(progress)

    expect(unlockedNpcIds).toContain('archivist-mera')
    expect(unlockedNpcIds).toContain('north-warden')
    expect(unlockedNpcIds).toContain('south-organizer')
    expect(unlockedNpcIds).not.toContain('east-broker')
  })

  it('getUnlockedNpcIds includes the gated NPC once First Contact is completed', () => {
    const progress = createInitialPlayerProgress()
    const afterFirstContact = recordMissionCompletion(progress, 'first-contact')

    expect(getUnlockedNpcIds(afterFirstContact)).toContain('east-broker')
  })

  it('gates north-analyst behind 40% overall progress rather than one specific mission', () => {
    // With 6 real missions, District Ties only reaches 2/6 ≈ 33% — still
    // below the 40% threshold. South Stability reaches 3/6 = 50%, which is
    // the first point that crosses it. The condition itself (minPercentage:
    // 40) is unchanged; it's the campaign's total mission count that moved
    // the trigger point, exactly as a percentage-relative condition should.
    const afterFirstContact = recordMissionCompletion(createInitialPlayerProgress(), 'first-contact')
    expect(getUnlockedNpcIds(afterFirstContact)).not.toContain('north-analyst')

    const afterDistrictTies = recordMissionCompletion(afterFirstContact, 'district-ties')
    expect(getUnlockedNpcIds(afterDistrictTies)).not.toContain('north-analyst')

    const afterSouthStability = recordMissionCompletion(afterDistrictTies, 'south-stability')
    expect(getUnlockedNpcIds(afterSouthStability)).toContain('north-analyst')
  })
})
