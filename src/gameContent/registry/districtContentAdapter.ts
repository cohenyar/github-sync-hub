import { initialDistricts } from '../../worldState'
import type { GameDistrictContent } from '../types/gameDistrictContent'

/** Returns the same array reference used to seed the world — no copy, no drift. */
export function getDistrictContent(): readonly GameDistrictContent[] {
  return initialDistricts
}
