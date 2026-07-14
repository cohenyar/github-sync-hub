export interface CampaignMissionEntry {
  order: number
  missionId: string
}

export interface GameCampaign {
  id: string
  title: string
  missions: readonly CampaignMissionEntry[]
}

/** Ephemeral, derived from live mission state — not persisted (no save/load yet). */
export interface CampaignProgress {
  completedMissionIds: readonly string[]
}

export interface CampaignSummary {
  totalMissions: number
  completedMissions: number
  /** 1-based, for "Mission X of Y" display. Null only for an empty campaign. */
  currentMissionIndex: number | null
  isComplete: boolean
}
