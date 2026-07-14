import type { EntityId } from '../types/engine'
import type { DistrictState, WorldEffect, WorldState } from './types'

function getDistrictOrThrow(state: WorldState, districtId: EntityId): DistrictState {
  const district = state.districts[districtId]
  if (!district) {
    throw new Error(`Unknown district: ${districtId}`)
  }
  return district
}

function withDistrict(
  state: WorldState,
  districtId: EntityId,
  updater: (district: DistrictState) => DistrictState,
): WorldState {
  const district = getDistrictOrThrow(state, districtId)
  return {
    ...state,
    districts: {
      ...state.districts,
      [districtId]: updater(district),
    },
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled world effect: ${JSON.stringify(value)}`)
}

export function applyEffect(state: WorldState, effect: WorldEffect): WorldState {
  switch (effect.kind) {
    case 'ADJUST_STAT':
      return withDistrict(state, effect.districtId, (district) => ({
        ...district,
        stats: {
          ...district.stats,
          [effect.stat]: (district.stats[effect.stat] ?? 0) + effect.delta,
        },
      }))

    case 'SET_STAT':
      return withDistrict(state, effect.districtId, (district) => ({
        ...district,
        stats: {
          ...district.stats,
          [effect.stat]: effect.value,
        },
      }))

    case 'ADVANCE_TURN':
      return { ...state, turn: state.turn + 1 }

    default:
      return assertNever(effect)
  }
}

export function applyEffects(state: WorldState, effects: readonly WorldEffect[]): WorldState {
  return effects.reduce(applyEffect, state)
}
