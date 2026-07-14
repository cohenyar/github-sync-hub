import { getDistrictContent } from './districtContentAdapter'
import { getMissionContent } from './missionContentAdapter'
import { getNpcContent } from './npcContentAdapter'
import { getProgressionContent } from './progressionContentAdapter'
import { getRewardContent } from './rewardContentAdapter'
import { getSqlChallengeContent } from './sqlChallengeContentAdapter'

export interface GameContentSummary {
  missions: number
  districts: number
  sqlChallenges: number
  rewards: number
  progressionEntries: number
  npcs: number
}

export function getGameContentSummary(): GameContentSummary {
  return {
    missions: getMissionContent().length,
    districts: getDistrictContent().length,
    sqlChallenges: getSqlChallengeContent().length,
    rewards: getRewardContent().length,
    progressionEntries: getProgressionContent().length,
    npcs: getNpcContent().length,
  }
}
