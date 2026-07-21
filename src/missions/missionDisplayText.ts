import type { MissionConfig } from './types'

export interface MissionDisplayText {
  title: string
  goal: string
  prompt: string
}

/** Hebrew display text for a mission, falling back to the English field when absent. */
export function getMissionDisplayText(mission: MissionConfig): MissionDisplayText {
  return {
    title: mission.titleHe ?? mission.title,
    goal: mission.goalHe ?? mission.goal,
    prompt: mission.promptHe ?? mission.prompt,
  }
}
