import type { DistrictState } from './types'

/**
 * The canonical starting districts for Meridian's world map. Shared by the
 * app (to seed the initial WorldState) and by any read-only view (such as
 * the Admin district section) that needs to see the same data without
 * duplicating it.
 *
 * North/South/East carry a second stat (stability) alongside loyalty, so
 * their status (see districtStatus.ts) reflects more than one axis of
 * district health. Core stays single-stat (signal) — it's the Records
 * Core, not a geographic district, and changing its shape would alter the
 * opacity/status readings already established for it in earlier steps.
 */
export const initialDistricts: readonly DistrictState[] = [
  { id: 'north', stats: { loyalty: 60, stability: 60 } },
  { id: 'south', stats: { loyalty: 40, stability: 20 } },
  { id: 'east', stats: { loyalty: 75, stability: 75 } },
  { id: 'core', stats: { signal: 0 } },
]
