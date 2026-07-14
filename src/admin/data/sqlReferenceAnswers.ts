import { getSqlChallengeContent } from '../../gameContent'
import type { AdminSqlReferenceAnswerItem } from '../types'

export function getSqlReferenceAnswerItems(): AdminSqlReferenceAnswerItem[] {
  return getSqlChallengeContent().map((challenge) => ({
    missionId: challenge.missionId,
    missionTitle: challenge.missionTitle,
    referenceSql: challenge.referenceSql,
  }))
}
