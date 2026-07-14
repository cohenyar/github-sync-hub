import type { GameCampaign } from '../../campaign'
import { getCompletionPercentage, type PlayerProgress } from '../../progression'
import type { UnlockCondition } from '../types'

function assertNever(value: never): never {
  throw new Error(`Unhandled unlock condition: ${JSON.stringify(value)}`)
}

export function evaluateCondition(
  condition: UnlockCondition,
  progress: PlayerProgress,
  campaign: GameCampaign,
): boolean {
  switch (condition.kind) {
    case 'always':
      return true
    case 'missionCompleted':
      return progress.completedMissionIds.includes(condition.missionId)
    case 'campaignCompleted':
      return progress.campaignProgress.campaignId === condition.campaignId && progress.campaignProgress.isComplete
    case 'progressionPercentage':
      return getCompletionPercentage(progress, campaign) >= condition.minPercentage
    default:
      return assertNever(condition)
  }
}
