import type { CampaignProgressState } from './campaignProgressState'
import type { MissionCompletionRecord } from './missionCompletionRecord'
import type { UnlockState } from './unlockState'

/**
 * The Progression Service's single source of truth for campaign advancement.
 * completedMissionIds is kept alongside completions as a flattened
 * convenience view (and to interoperate directly with campaign/selectors.ts,
 * which already expects exactly this shape).
 */
export interface PlayerProgress {
  completedMissionIds: readonly string[]
  completions: readonly MissionCompletionRecord[]
  unlockState: UnlockState
  campaignProgress: CampaignProgressState
  /**
   * Batch 3A.4B — namespaced lesson ids (e.g. "lesson:math-001") the player
   * has completed. Deliberately a separate field, never merged into
   * completedMissionIds: that array's length feeds getCompletionPercentage/
   * defaultCampaign's completion count, and campaign/selectors.ts's
   * isCampaignComplete checks every one of defaultCampaign's own mission
   * ids is present in it — mixing lesson ids in would silently inflate
   * completion percentages without changing what isCampaignComplete checks.
   * Optional so existing saves/fixtures with no field at all still satisfy
   * this type; every reader defaults a missing value to [] (see
   * recordLessonCompletion / isLessonCompleted).
   */
  completedLessonIds?: readonly string[]
  /**
   * Meridian 1.3 — Core Loop §06: how many conversations the player has had
   * with each NPC, keyed by npc id. Optional, same fallback-to-empty
   * convention as completedLessonIds — every reader defaults a missing
   * entry to 0 (see recordNpcConversation / getNpcFamiliarityTier).
   */
  npcFamiliarity?: Readonly<Record<string, number>>
  /** Meridian 1.3 — Core Loop §04 collectibles. Optional, same empty-default convention as completedLessonIds. */
  collectedArchivePageIds?: readonly string[]
}
