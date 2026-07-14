export type UnlockTargetType = 'mission' | 'district' | 'npc'

export interface UnlockTarget {
  type: UnlockTargetType
  id: string
}
