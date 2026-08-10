import type { CampaignProgressState } from './campaignProgressState'
import type { MissionCompletionRecord } from './missionCompletionRecord'
import type { UnlockState } from './unlockState'

/** Learning difficulty — scaffolding/help only, never a different campaign (see setDifficultyLevel / getDifficultyLevel). */
export type DifficultyLevel = 1 | 2 | 3

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
  /**
   * Meridian 1.4 — Player Identity MVP. The name the player chose during
   * Profile Creation. Optional, same fallback convention as every other
   * 1.3 addition: absent on any save from before this field existed, and
   * every reader treats an absent/empty name as "no local profile yet" —
   * see hasLocalPlayerProfile in playerProfile.ts.
   */
  playerName?: string
  /**
   * Meridian 1.4 — an id into PLAYER_AVATAR_PRESETS (see
   * worldScene/logic/playerAppearance.ts). Optional; an absent or unknown
   * id resolves to the default preset, never a crash.
   */
  playerAvatarId?: string
  /**
   * First Mission UX pass — learning difficulty (scaffolding/help amount),
   * never a different campaign: same missions, same progression order, same
   * unlock rules, same story. Optional, same fallback-to-default convention
   * as every other field on this type — absent (an old save, or a save from
   * before this field existed) resolves to 1 everywhere via
   * getDifficultyLevel, never a crash or a required migration step.
   */
  difficultyLevel?: DifficultyLevel
}
