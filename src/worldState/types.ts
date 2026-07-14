import type { EntityId } from '../types/engine'

export interface DistrictState {
  id: EntityId
  stats: Record<string, number>
}

export interface WorldState {
  turn: number
  districts: Record<EntityId, DistrictState>
}

/**
 * World effects are the only mechanism that may change a WorldState.
 * Only the Verifier is allowed to produce them from a verdict; Odin must
 * never construct or apply one directly.
 */
export type WorldEffect =
  | { kind: 'ADJUST_STAT'; districtId: EntityId; stat: string; delta: number }
  | { kind: 'SET_STAT'; districtId: EntityId; stat: string; value: number }
  | { kind: 'ADVANCE_TURN' }
