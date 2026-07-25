import { defaultCampaign, type GameCampaign } from '../../campaign'
import type { PlayerProgress } from '../types'

function firstMissionId(campaign: GameCampaign): string | null {
  const sorted = [...campaign.missions].sort((a, b) => a.order - b.order)
  return sorted.length > 0 ? sorted[0].missionId : null
}

export function createInitialPlayerProgress(campaign: GameCampaign = defaultCampaign): PlayerProgress {
  const currentMissionId = firstMissionId(campaign)

  return {
    completedMissionIds: [],
    completions: [],
    unlockState: { unlockedMissionIds: currentMissionId ? [currentMissionId] : [] },
    campaignProgress: {
      campaignId: campaign.id,
      currentMissionId,
      isComplete: false,
    },
    completedLessonIds: [],
  }
}
