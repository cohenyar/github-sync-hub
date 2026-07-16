import type { NpcConfig } from '../npcs'
import { getNpcsByDistrict } from '../npcs'
import { DESTINATION_IDS, getDestinationMissions } from '../worldScene'

/**
 * Presentation-only lookup: which destination/district a mission belongs
 * to, derived from the existing (already-exported) destination→mission
 * map. Not a new engine concept — just reading the same data the world
 * scene already uses for its own hub, from the other direction.
 */
export function getDistrictIdForMission(missionId: string): string | undefined {
  return DESTINATION_IDS.find((destinationId) =>
    getDestinationMissions(destinationId).some((mission) => mission.id === missionId),
  )
}

/**
 * The companion the dashboard features: the first unlocked NPC in the active
 * mission's own district — a presentation-only pairing (existing district→NPC
 * data + existing mission→district data), not a new story relationship. It's
 * tied to the active mission, NOT to whatever marker the player last clicked
 * (that opens the separate bio panel), so the companion always represents the
 * character whose stage the player is currently on.
 */
export function getCompanionNpc(
  activeMissionId: string,
  unlockedNpcIds: readonly string[],
): NpcConfig | undefined {
  const districtId = getDistrictIdForMission(activeMissionId)
  if (!districtId) return undefined

  return getNpcsByDistrict(districtId).find((npc) => unlockedNpcIds.includes(npc.id))
}
