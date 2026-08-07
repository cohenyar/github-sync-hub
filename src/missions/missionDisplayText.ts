import type { MissionConfig } from './types'

export interface MissionDisplayText {
  title: string
  goal: string
  prompt: string
  /** Playtest fix pass (issue 6C) — undefined when the mission has no authored hint yet; callers (AskOdinPanel) supply their own fallback. */
  hint?: string
}

/** Hebrew display text for a mission, falling back to the English field when absent. */
export function getMissionDisplayText(mission: MissionConfig): MissionDisplayText {
  return {
    title: mission.titleHe ?? mission.title,
    goal: mission.goalHe ?? mission.goal,
    prompt: mission.promptHe ?? mission.prompt,
    hint: mission.hintHe,
  }
}
