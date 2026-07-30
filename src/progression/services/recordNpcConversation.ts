import type { PlayerProgress } from '../types'

/**
 * Meridian 1.3 — Core Loop §06: one conversation-count tick per NPC, each
 * time the player opens their dialogue. Deliberately does not touch
 * completedMissionIds, completions, unlockState, campaignProgress, or
 * completedLessonIds — a familiarity tier is its own axis, not a byproduct
 * of finishing content. Defaults a missing npcFamiliarity (an older save,
 * or a fixture predating Meridian 1.3) to an empty record before recording.
 */
export function recordNpcConversation(progress: PlayerProgress, npcId: string): PlayerProgress {
  const existing = progress.npcFamiliarity ?? {}
  const current = existing[npcId] ?? 0
  return { ...progress, npcFamiliarity: { ...existing, [npcId]: current + 1 } }
}
