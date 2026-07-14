import { missionRegistry } from '../../missions'
import type { GameProgressionContent } from '../types/gameProgressionContent'

/** The content-defined mission order players are expected to progress through. */
export function getProgressionContent(): GameProgressionContent[] {
  return missionRegistry.map((mission, index) => ({
    order: index + 1,
    missionId: mission.id,
    title: mission.title,
  }))
}
