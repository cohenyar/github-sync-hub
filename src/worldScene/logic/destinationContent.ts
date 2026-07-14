import { he } from '../../i18n'
import { getMissionById, type MissionConfig } from '../../missions'
import type { PlayerProgress } from '../../progression'
import { getMissionContentStatus, type ContentStatus } from '../../unlocks'

/**
 * Hub World, A1 — which missions belong to which destination. This is the
 * one new concept this batch introduces, and it's pure content data, not a
 * new engine: Campaign/Progression/Mission Runtime/Unlock Engine are read
 * from (via getMissionContentStatus) but never modified, and nothing here
 * is persisted — every selector below is derived fresh from the player's
 * existing progress every time it's called.
 *
 * The Hub (Records Core) hosts First Contact — the on-ramp everyone gets
 * before choosing a course world. North/South/East are course worlds;
 * East intentionally holds three missions, so repeat visits walk through
 * them in order with no new stored state (see getDestinationEntryMission).
 */
export interface DestinationConfig {
  id: string
  name: string
  missionIds: readonly string[]
}

const DESTINATIONS: readonly DestinationConfig[] = [
  { id: 'core', name: he.recordsCoreName, missionIds: ['first-contact'] },
  { id: 'north', name: he.northCourseName, missionIds: ['district-ties'] },
  { id: 'south', name: he.southCourseName, missionIds: ['south-stability'] },
  { id: 'east', name: he.eastCourseName, missionIds: ['full-signal', 'linked-records', 'priority-signal'] },
]

export const DESTINATION_IDS: readonly string[] = DESTINATIONS.map((destination) => destination.id)

const DESTINATIONS_BY_ID: Readonly<Record<string, DestinationConfig>> = Object.fromEntries(
  DESTINATIONS.map((destination) => [destination.id, destination]),
)

export function getDestinationConfig(destinationId: string): DestinationConfig | undefined {
  return DESTINATIONS_BY_ID[destinationId]
}

export function getDestinationMissions(destinationId: string): MissionConfig[] {
  const config = getDestinationConfig(destinationId)
  if (!config) return []
  const missions: MissionConfig[] = []
  for (const missionId of config.missionIds) {
    const mission = getMissionById(missionId)
    if (mission) missions.push(mission)
  }
  return missions
}

/**
 * Which mission opens when the player enters this destination: the first
 * one that isn't completed yet, or the last one if every mission in this
 * destination is already done. This is what makes East walk through its
 * three missions across repeat visits — a plain array scan over the
 * existing progress, nothing stored per destination.
 */
export function getDestinationEntryMission(
  destinationId: string,
  playerProgress: PlayerProgress,
): MissionConfig | undefined {
  const missions = getDestinationMissions(destinationId)
  if (missions.length === 0) return undefined
  const nextIncomplete = missions.find((mission) => getMissionContentStatus(playerProgress, mission.id) !== 'completed')
  return nextIncomplete ?? missions[missions.length - 1]
}

/**
 * A destination is locked exactly when its first (earliest, in campaign
 * order) mission is locked — the same three-state vocabulary
 * (locked/available/completed) already used everywhere else in the game.
 */
export function getDestinationContentStatus(destinationId: string, playerProgress: PlayerProgress): ContentStatus {
  const missions = getDestinationMissions(destinationId)
  if (missions.length === 0) return 'locked'

  const statuses = missions.map((mission) => getMissionContentStatus(playerProgress, mission.id))
  if (statuses.every((status) => status === 'completed')) return 'completed'
  if (statuses[0] === 'locked') return 'locked'
  return 'available'
}

export interface DestinationProgress {
  completed: number
  total: number
}

/** A plain count over this destination's own missions — fully derived, never stored. */
export function getDestinationProgress(destinationId: string, playerProgress: PlayerProgress): DestinationProgress {
  const missions = getDestinationMissions(destinationId)
  const completed = missions.filter((mission) => getMissionContentStatus(playerProgress, mission.id) === 'completed').length
  return { completed, total: missions.length }
}
