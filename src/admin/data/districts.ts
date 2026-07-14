import { getDistrictContent } from '../../gameContent'
import type { DistrictState } from '../../worldState'

export function getDistrictItems(): readonly DistrictState[] {
  return getDistrictContent()
}
