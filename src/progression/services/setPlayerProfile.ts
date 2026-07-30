import type { PlayerProgress } from '../types'

/**
 * Meridian 1.4 — Player Identity MVP. Sets the local profile's name and
 * chosen avatar preset id. Deliberately does not touch completedMissionIds,
 * completions, unlockState, campaignProgress, completedLessonIds,
 * npcFamiliarity, or collectedArchivePageIds — identity is its own axis,
 * not a byproduct of progress. Name is trimmed; an empty result is treated
 * as "no name" rather than persisting whitespace.
 */
export function setPlayerProfile(progress: PlayerProgress, name: string, avatarId: string): PlayerProgress {
  const trimmed = name.trim()
  return { ...progress, playerName: trimmed.length > 0 ? trimmed : undefined, playerAvatarId: avatarId }
}
