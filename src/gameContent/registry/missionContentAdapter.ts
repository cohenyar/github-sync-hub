import { missionRegistry } from '../../missions'
import type { GameMissionContent } from '../types/gameMissionContent'

export function getMissionContent(): GameMissionContent[] {
  return missionRegistry.map((mission) => ({
    id: mission.id,
    title: mission.title,
    goal: mission.goal,
    prompt: mission.prompt,
    referenceSql: mission.referenceSql,
  }))
}
