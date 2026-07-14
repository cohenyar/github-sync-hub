import type { DistrictState, WorldState } from './types'

export function createWorldState(districts: readonly DistrictState[] = []): WorldState {
  const byId: Record<string, DistrictState> = {}
  for (const district of districts) {
    byId[district.id] = district
  }

  return {
    turn: 0,
    districts: byId,
  }
}
