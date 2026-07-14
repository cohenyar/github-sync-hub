import type { DistrictState } from './types'

/** The average of a district's stats — the shared basis for both its visual intensity and its status. */
export function getAverageStat(district: DistrictState): number {
  const values = Object.values(district.stats)
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length
}
