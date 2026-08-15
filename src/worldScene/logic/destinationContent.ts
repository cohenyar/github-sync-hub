import { he } from '../../i18n'
import { getMissionById, type MissionConfig } from '../../missions'
import type { PlayerProgress } from '../../progression'
import { defaultUnlockRules, getMissionContentStatus, type ContentStatus } from '../../unlocks'

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
/**
 * Meridian 2.0 "open learning world" pass — East hosts one continuation
 * mission per subject (History/English/Math), each gated only by that
 * subject's own first mission (see defaultUnlockRules.ts), so array order no
 * longer implies unlock order the way it did under the old single
 * cross-subject chain. Prefer a mission that's actually playable right now;
 * only fall back to "first incomplete" (which may still be locked) once
 * nothing in the destination is currently available.
 */
export function getDestinationEntryMission(
  destinationId: string,
  playerProgress: PlayerProgress,
): MissionConfig | undefined {
  const missions = getDestinationMissions(destinationId)
  if (missions.length === 0) return undefined
  const nextPlayable = missions.find((mission) => getMissionContentStatus(playerProgress, mission.id) === 'available')
  if (nextPlayable) return nextPlayable
  const nextIncomplete = missions.find((mission) => getMissionContentStatus(playerProgress, mission.id) !== 'completed')
  return nextIncomplete ?? missions[missions.length - 1]
}

/**
 * A destination is locked only when EVERY one of its missions is locked —
 * not just the first one in the list. Meridian 2.0 "open learning world"
 * pass: East holds three independent per-subject continuations, so finishing
 * any single subject's first mission (History/English/Math) must open East
 * for that subject without requiring the other two at all. The old
 * "locked iff first-listed mission is locked" rule effectively let one
 * subject (whichever was first in the array) gate the other two — exactly
 * the cross-subject lock this pass removes.
 */
export function getDestinationContentStatus(destinationId: string, playerProgress: PlayerProgress): ContentStatus {
  const missions = getDestinationMissions(destinationId)
  if (missions.length === 0) return 'locked'

  const statuses = missions.map((mission) => getMissionContentStatus(playerProgress, mission.id))
  if (statuses.every((status) => status === 'completed')) return 'completed'
  if (statuses.every((status) => status === 'locked')) return 'locked'
  return 'available'
}

function getMissionUnlockRequirementMissionId(missionId: string): string | undefined {
  const rule = defaultUnlockRules.find((candidate) => candidate.target.type === 'mission' && candidate.target.id === missionId)
  const condition = rule?.conditions.find((candidate) => candidate.kind === 'missionCompleted')
  return condition?.kind === 'missionCompleted' ? condition.missionId : undefined
}

/**
 * Playtest fix pass (issue 4) — which mission the player must actually
 * finish before this destination unlocks. Deliberately not the
 * destination's own first mission id: East's own first mission is
 * `full-signal`, but the real prerequisite blocking it (what a player
 * needs to be told) is `south-stability`, named in that mission's own
 * unlock rule. Undefined once the destination is unlocked, or if it was
 * never gated in the first place.
 */
export function getDestinationLockRequirementMissionId(
  destinationId: string,
  playerProgress: PlayerProgress,
): string | undefined {
  if (getDestinationContentStatus(destinationId, playerProgress) !== 'locked') return undefined
  const missions = getDestinationMissions(destinationId)
  const first = missions[0]
  return first ? getMissionUnlockRequirementMissionId(first.id) : undefined
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
