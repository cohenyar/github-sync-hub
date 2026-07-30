import { defaultCampaign, type GameCampaign } from '../../campaign'
import { he } from '../../i18n'
import { lessonRegistry } from '../../learning/lessonRegistry'
import type { PlayerProgress } from '../types'

export function getCurrentMissionId(progress: PlayerProgress): string | null {
  return progress.campaignProgress.currentMissionId
}

export function getUnlockedMissionIds(progress: PlayerProgress): readonly string[] {
  return progress.unlockState.unlockedMissionIds
}

export function isMissionUnlocked(progress: PlayerProgress, missionId: string): boolean {
  return progress.unlockState.unlockedMissionIds.includes(missionId)
}

export function getCompletionPercentage(progress: PlayerProgress, campaign: GameCampaign = defaultCampaign): number {
  const total = campaign.missions.length
  if (total === 0) return 0
  return Math.round((progress.completedMissionIds.length / total) * 100)
}

/** Batch 3A.4B — reads the separate lesson-completion field, defaulting a missing one to []. */
export function isLessonCompleted(progress: PlayerProgress, lessonId: string): boolean {
  return (progress.completedLessonIds ?? []).includes(lessonId)
}

/** Meridian 1.3 — Core Loop §04 collectibles. */
export function isArchivePageCollected(progress: PlayerProgress, pageId: string): boolean {
  return (progress.collectedArchivePageIds ?? []).includes(pageId)
}

export function getCollectedArchivePageIds(progress: PlayerProgress): readonly string[] {
  return progress.collectedArchivePageIds ?? []
}

export interface PlayerProgressSummary {
  completedMissions: number
  totalMissions: number
  completionPercentage: number
  unlockedMissionIds: readonly string[]
  currentMissionId: string | null
  isCampaignComplete: boolean
}

export function getPlayerProgressSummary(
  progress: PlayerProgress,
  campaign: GameCampaign = defaultCampaign,
): PlayerProgressSummary {
  return {
    completedMissions: progress.completedMissionIds.length,
    totalMissions: campaign.missions.length,
    completionPercentage: getCompletionPercentage(progress, campaign),
    unlockedMissionIds: progress.unlockState.unlockedMissionIds,
    currentMissionId: progress.campaignProgress.currentMissionId,
    isCampaignComplete: progress.campaignProgress.isComplete,
  }
}

/**
 * Meridian 1.3 — Core Loop §04: one shared rank across every subject, not a
 * separate meter per subject. Every SQL mission and every lesson counts
 * toward the exact same number, deliberately — see the Core Loop design's
 * "one number a player can say out loud" reasoning.
 */
export type ExplorerRankTier = 'newcomer' | 'helper' | 'trusted' | 'guardian'

export interface ExplorerRank {
  completions: number
  totalContent: number
  tier: ExplorerRankTier
}

const RANK_TIER_THRESHOLDS: ReadonlyArray<{ minCompletions: number; tier: ExplorerRankTier }> = [
  { minCompletions: 0, tier: 'newcomer' },
  { minCompletions: 1, tier: 'helper' },
  { minCompletions: 4, tier: 'trusted' },
  { minCompletions: 7, tier: 'guardian' },
]

export function getExplorerRank(
  progress: PlayerProgress,
  campaign: GameCampaign = defaultCampaign,
): ExplorerRank {
  const completions = progress.completedMissionIds.length + (progress.completedLessonIds ?? []).length
  const totalContent = campaign.missions.length + lessonRegistry.length
  const tier =
    [...RANK_TIER_THRESHOLDS].reverse().find((entry) => completions >= entry.minCompletions)?.tier ?? 'newcomer'

  return { completions, totalContent, tier }
}

const EXPLORER_RANK_LABEL: Readonly<Record<ExplorerRankTier, string>> = {
  newcomer: he.explorerRankNewcomer,
  helper: he.explorerRankHelper,
  trusted: he.explorerRankTrusted,
  guardian: he.explorerRankGuardian,
}

export function getExplorerRankLabel(tier: ExplorerRankTier): string {
  return EXPLORER_RANK_LABEL[tier]
}

/**
 * Meridian 1.3 — Core Loop §06: a familiarity tier per NPC, driven purely by
 * how many conversations the player has had with them (npcFamiliarity),
 * independent of mission/lesson completion. Generic across every NPC —
 * authoring a bonus line for a given tier is a content decision (see
 * dialogueContent.ts), not a mechanism one.
 */
export type NpcFamiliarityTier = 'stranger' | 'acquaintance' | 'trusted' | 'friend'

const FAMILIARITY_TIER_THRESHOLDS: ReadonlyArray<{ minConversations: number; tier: NpcFamiliarityTier }> = [
  { minConversations: 0, tier: 'stranger' },
  { minConversations: 1, tier: 'acquaintance' },
  { minConversations: 5, tier: 'trusted' },
  { minConversations: 10, tier: 'friend' },
]

export function getNpcConversationCount(progress: PlayerProgress, npcId: string): number {
  return progress.npcFamiliarity?.[npcId] ?? 0
}

export function getNpcFamiliarityTier(progress: PlayerProgress, npcId: string): NpcFamiliarityTier {
  const conversations = getNpcConversationCount(progress, npcId)
  return (
    [...FAMILIARITY_TIER_THRESHOLDS].reverse().find((entry) => conversations >= entry.minConversations)?.tier ??
    'stranger'
  )
}

const NPC_FAMILIARITY_LABEL: Readonly<Record<NpcFamiliarityTier, string>> = {
  stranger: he.npcFamiliarityStranger,
  acquaintance: he.npcFamiliarityAcquaintance,
  trusted: he.npcFamiliarityTrusted,
  friend: he.npcFamiliarityFriend,
}

export function getNpcFamiliarityLabel(tier: NpcFamiliarityTier): string {
  return NPC_FAMILIARITY_LABEL[tier]
}
