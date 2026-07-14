import { defaultCampaign, isCampaignComplete, type GameCampaign } from '../../campaign'
import type { PlayerProgress } from '../types'

/**
 * Records a mission as completed and derives the resulting unlock and
 * campaign state. Idempotent: completing an already-completed mission
 * again is a no-op (returns the same progress, unchanged).
 */
export function recordMissionCompletion(
  progress: PlayerProgress,
  missionId: string,
  campaign: GameCampaign = defaultCampaign,
): PlayerProgress {
  if (progress.completedMissionIds.includes(missionId)) {
    return progress
  }

  const completedMissionIds = [...progress.completedMissionIds, missionId]
  const completions = [...progress.completions, { missionId, sequence: progress.completions.length + 1 }]

  const sortedEntries = [...campaign.missions].sort((a, b) => a.order - b.order)
  const currentEntry = sortedEntries.find((entry) => !completedMissionIds.includes(entry.missionId))
  const currentMissionId = currentEntry ? currentEntry.missionId : null

  const unlockedMissionIds = sortedEntries
    .filter((entry) => completedMissionIds.includes(entry.missionId) || entry.missionId === currentMissionId)
    .map((entry) => entry.missionId)

  return {
    completedMissionIds,
    completions,
    unlockState: { unlockedMissionIds },
    campaignProgress: {
      campaignId: campaign.id,
      currentMissionId,
      isComplete: isCampaignComplete(campaign, { completedMissionIds }),
    },
  }
}
