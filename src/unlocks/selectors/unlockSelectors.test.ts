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

  it('the second mission is locked until the first is completed', () => {
    const progress = createInitialPlayerProgress()
    expect(isContentUnlocked(progress, { type: 'mission', id: 'district-ties' })).toBe(false)

    const completed = recordMissionCompletion(progress, 'first-contact')
    expect(isContentUnlocked(completed, { type: 'mission', id: 'district-ties' })).toBe(true)
  })

  it('getUnlockedContentIds includes the first mission and all districts; getLockedContentIds includes the gated mission', () => {
    const progress = createInitialPlayerProgress()
    const unlocked = getUnlockedContentIds(progress)
    expect(unlocked).toContainEqual({ type: 'mission', id: 'first-contact' })
    expect(unlocked.length).toBeGreaterThanOrEqual(5) // 1 unlocked mission + 4 districts

    expect(getLockedContentIds(progress)).toContainEqual({ type: 'mission', id: 'district-ties' })
  })

  it('reports "available" before completion and "completed" after, for the first mission', () => {
    const progress = createInitialPlayerProgress()
    expect(getMissionContentStatus(progress, 'first-contact')).toBe('available')

    const completed = recordMissionCompletion(progress, 'first-contact')
    expect(getMissionContentStatus(completed, 'first-contact')).toBe('completed')
  })

  it('reports "locked" then "available" for the gated second mission', () => {
    const progress = createInitialPlayerProgress()
    expect(getMissionContentStatus(progress, 'district-ties')).toBe('locked')

    const completed = recordMissionCompletion(progress, 'first-contact')
    expect(getMissionContentStatus(completed, 'district-ties')).toBe('available')
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
