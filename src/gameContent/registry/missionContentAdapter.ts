import { missionRegistry } from '../../missions'
import type { GameMissionContent } from '../types/gameMissionContent'

/** One entry per registered mission — feeds the admin mission list/count. */
export function getMissionContent(): GameMissionContent[] {
  return missionRegistry.map((mission) => ({
    id: mission.id,
    title: mission.title,
    goal: mission.goal,
    prompt: mission.prompt,
  }))
}
