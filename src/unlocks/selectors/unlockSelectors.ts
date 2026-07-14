import { defaultCampaign } from '../../campaign'
import type { PlayerProgress } from '../../progression'
import { getLockedContent, getUnlockedContent, isUnlocked } from '../engine/unlockEngine'
import { defaultUnlockRules } from '../services/defaultUnlockRules'
import type { UnlockTarget } from '../types'

export function isContentUnlocked(progress: PlayerProgress, target: UnlockTarget): boolean {
  return isUnlocked(defaultUnlockRules, progress, defaultCampaign, target)
}

export function getUnlockedContentIds(progress: PlayerProgress): UnlockTarget[] {
  return getUnlockedContent(defaultUnlockRules, progress, defaultCampaign)
}

export function getLockedContentIds(progress: PlayerProgress): UnlockTarget[] {
  return getLockedContent(defaultUnlockRules, progress, defaultCampaign)
}

export type ContentStatus = 'locked' | 'available' | 'completed'

export function getMissionContentStatus(progress: PlayerProgress, missionId: string): ContentStatus {
  if (progress.completedMissionIds.includes(missionId)) {
    return 'completed'
  }
  return isContentUnlocked(progress, { type: 'mission', id: missionId }) ? 'available' : 'locked'
}

export function getUnlockedNpcIds(progress: PlayerProgress): readonly string[] {
  return getUnlockedContentIds(progress)
    .filter((target) => target.type === 'npc')
    .map((target) => target.id)
}
