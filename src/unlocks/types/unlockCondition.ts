export type UnlockCondition =
  | { kind: 'always' }
  | { kind: 'missionCompleted'; missionId: string }
  | { kind: 'campaignCompleted'; campaignId: string }
  | { kind: 'progressionPercentage'; minPercentage: number }
