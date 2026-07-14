import type { NpcConfig } from '../../npcs'
import type { ContentStatus } from '../../unlocks'
import type { DistrictStatus } from '../../worldState'

/**
 * Everything an NPC's dialogue state needs, assembled by the caller (App.tsx
 * already computes all of this via existing selectors — Unlock Engine's
 * getMissionContentStatus, Mission Runtime's status.lastResult, World
 * State's getDistrictStatus). This module makes no engine calls of its own.
 */
export interface NpcDialogueContext {
  missionContentStatusByMissionId: Readonly<Record<string, ContentStatus>>
  activeMissionId: string
  hasAttemptedActiveMission: boolean
  districtStatusByDistrictId: Readonly<Record<string, DistrictStatus>>
}

export type MissionDialoguePhase = 'locked' | 'available' | 'inProgress' | 'completed'

export type NpcDialogueState =
  | { kind: 'mission'; phase: MissionDialoguePhase }
  | { kind: 'district'; status: DistrictStatus }
  | { kind: 'static' }

/**
 * Which NPCs hand off a specific mission — the only NPCs whose dialogue
 * tracks a mission's lifecycle rather than their home district's status.
 * Content-only data, same pattern as dialogueContent.ts.
 */
const NPC_LINKED_MISSION_ID: Readonly<Record<string, string>> = {
  'north-warden': 'first-contact',
  'south-organizer': 'south-stability',
  'north-analyst': 'full-signal',
}

/**
 * NPCs whose dialogue is a single static line rather than mission- or
 * district-status-driven — today just Kestrel Vane, who only ever appears
 * after the campaign is already complete.
 */
const STATIC_DIALOGUE_NPC_IDS: ReadonlySet<string> = new Set(['city-voice'])

/**
 * Derives which authored dialogue bucket an NPC falls into right now, from
 * data every one of these engines already computes — no new persisted
 * state, no branching tree, no per-NPC "have I met them" flag. A mission-
 * linked NPC is "in progress" only once the player has actually attempted
 * that exact mission (status.lastResult is set) while it's their active
 * mission — not merely because its database auto-loaded at boot.
 */
export function getNpcDialogueState(npc: NpcConfig, context: NpcDialogueContext): NpcDialogueState {
  const linkedMissionId = NPC_LINKED_MISSION_ID[npc.id]
  if (linkedMissionId) {
    const contentStatus = context.missionContentStatusByMissionId[linkedMissionId] ?? 'locked'
    if (contentStatus === 'locked') return { kind: 'mission', phase: 'locked' }
    if (contentStatus === 'completed') return { kind: 'mission', phase: 'completed' }

    const inProgress = context.activeMissionId === linkedMissionId && context.hasAttemptedActiveMission
    return { kind: 'mission', phase: inProgress ? 'inProgress' : 'available' }
  }

  if (STATIC_DIALOGUE_NPC_IDS.has(npc.id)) return { kind: 'static' }

  const districtStatus = context.districtStatusByDistrictId[npc.districtId]
  if (districtStatus) return { kind: 'district', status: districtStatus }

  return { kind: 'static' }
}
