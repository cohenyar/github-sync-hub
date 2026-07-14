import { districtTiesMission } from './districtTies'
import { firstContactMission } from './firstContact'
import { fullSignalMission } from './fullSignal'
import { linkedRecordsMission } from './linkedRecords'
import { prioritySignalMission } from './prioritySignal'
import { southStabilityMission } from './southStability'
import type { MissionConfig } from './types'

const missions: MissionConfig[] = [
  firstContactMission,
  districtTiesMission,
  southStabilityMission,
  fullSignalMission,
  linkedRecordsMission,
  prioritySignalMission,
]

/**
 * The mission registry is the single, data-driven list of missions the app
 * knows about. Adding a mission means adding data here (or, since Step 27,
 * through Admin CRUD) — nothing that consumes a MissionConfig needs to
 * change. Exposed as read-only; addMission/updateMission/removeMission
 * below are the only sanctioned way to mutate the underlying list, and they
 * mutate this exact array, not a copy — every existing reader (gameContent
 * adapters, Admin) sees edits immediately since they all read fresh.
 */
export const missionRegistry: readonly MissionConfig[] = missions

export function getMissionById(id: string): MissionConfig | undefined {
  return missions.find((mission) => mission.id === id)
}

export function getDefaultMission(): MissionConfig {
  const [first] = missions
  if (!first) {
    throw new Error('No missions are registered.')
  }
  return first
}

export function addMission(mission: MissionConfig): void {
  if (missions.some((existing) => existing.id === mission.id)) {
    throw new Error(`Mission id "${mission.id}" already exists.`)
  }
  missions.push(mission)
}

/**
 * Shallow-merges updates onto the existing mission so fields the caller
 * doesn't touch — notably successEffect, which Admin's edit form does not
 * author — are preserved rather than dropped.
 */
export function updateMission(id: string, updates: Partial<Omit<MissionConfig, 'id'>>): MissionConfig {
  const index = missions.findIndex((mission) => mission.id === id)
  if (index === -1) {
    throw new Error(`Mission id "${id}" does not exist.`)
  }
  const updated = { ...missions[index], ...updates }
  missions[index] = updated
  return updated
}

export function removeMission(id: string): void {
  const index = missions.findIndex((mission) => mission.id === id)
  if (index === -1) {
    throw new Error(`Mission id "${id}" does not exist.`)
  }
  missions.splice(index, 1)
}
