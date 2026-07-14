import { getRewardContent } from '../../gameContent'
import type { AdminRewardItem } from '../types'

/** A "reward" is the WorldEffect a mission grants on completion. */
export function getRewardItems(): AdminRewardItem[] {
  return getRewardContent()
}
