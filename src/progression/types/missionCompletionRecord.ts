export interface MissionCompletionRecord {
  missionId: string
  /** 1-based order in which this mission was completed relative to others. */
  sequence: number
}
