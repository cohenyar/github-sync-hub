import { missionRegistry } from '../../missions'
import type { GameSqlChallengeContent } from '../types/gameSqlChallengeContent'

export function getSqlChallengeContent(): GameSqlChallengeContent[] {
  return missionRegistry.map((mission) => ({
    missionId: mission.id,
    missionTitle: mission.title,
    referenceSql: mission.referenceSql,
  }))
}
