import { getMissionContent } from '../../gameContent'
import type { AdminMissionItem } from '../types'

export function getMissionItems(): AdminMissionItem[] {
  return getMissionContent().map((mission) => ({
    id: mission.id,
    title: mission.title,
    goal: mission.goal,
  }))
}
