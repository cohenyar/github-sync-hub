import { getDistrictContent } from './districtContentAdapter'
import { getMissionContent } from './missionContentAdapter'
import { getNpcContent } from './npcContentAdapter'
import { getProgressionContent } from './progressionContentAdapter'
import { getRewardContent } from './rewardContentAdapter'

export interface GameContentSummary {
  missions: number
  districts: number
  rewards: number
  progressionEntries: number
  npcs: number
}

export function getGameContentSummary(): GameContentSummary {
  return {
    missions: getMissionContent().length,
    districts: getDistrictContent().length,
    rewards: getRewardContent().length,
    progressionEntries: getProgressionContent().length,
    npcs: getNpcContent().length,
  }
}
