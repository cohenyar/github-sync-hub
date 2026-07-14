import { getAverageStat } from './districtStats'
import type { DistrictState } from './types'

export type DistrictStatus = 'thriving' | 'stable' | 'unstable'

const THRIVING_THRESHOLD = 70
const UNSTABLE_THRESHOLD = 40

/**
 * A district's status, derived purely from its current stats — no new
 * WorldEffect is needed to produce this, it's a read-only view over
 * WorldState computed the same way for every district, core included.
 */
export function getDistrictStatus(district: DistrictState): DistrictStatus {
  const average = getAverageStat(district)

  if (average >= THRIVING_THRESHOLD) return 'thriving'
  if (average < UNSTABLE_THRESHOLD) return 'unstable'
  return 'stable'
}
