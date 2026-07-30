export type UnlockCondition =
  | { kind: 'always' }
  | { kind: 'missionCompleted'; missionId: string }
  | { kind: 'campaignCompleted'; campaignId: string }
  | { kind: 'progressionPercentage'; minPercentage: number }
  /** Meridian 1.3 — mirrors missionCompleted exactly, for content gated behind a subject-neutral lesson instead of a SQL mission. */
  | { kind: 'lessonCompleted'; lessonId: string }
