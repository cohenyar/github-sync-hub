import { defaultCampaign, type GameCampaign } from '../../campaign'
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
