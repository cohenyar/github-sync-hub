import { getAverageStat } from '../worldState'
import type { DistrictState } from '../worldState/types'

export interface DistrictVisualState {
  id: string
  intensity: number
}

/**
 * Deterministically derives a 0-1 visual intensity from a district's stats.
 * This is a placeholder normalization (average of all stats, assumed to sit
 * roughly in a 0-100 range) until game balance defines specific stats and
 * their visual meaning — it carries no gameplay logic of its own.
 */
export function toDistrictVisualState(district: DistrictState): DistrictVisualState {
  return {
    id: district.id,
    intensity: clamp01(getAverageStat(district) / 100),
  }
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}
