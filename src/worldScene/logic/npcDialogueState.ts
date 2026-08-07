import { getLessonIdForNpc } from '../../learning'
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
  /** Batch 3A.4B — namespaced lesson ids the player has completed. Optional so every existing caller/fixture omitting it still type-checks; treated as empty when absent. */
  completedLessonIds?: readonly string[]
}

export type MissionDialoguePhase = 'locked' | 'available' | 'inProgress' | 'completed'
export type LessonDialoguePhase = 'available' | 'completed'

export type NpcDialogueState =
  | { kind: 'mission'; phase: MissionDialoguePhase }
  | { kind: 'lesson'; phase: LessonDialoguePhase }
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
  // Playtest fix pass (issue 4) — east-broker used to be a district-status
  // NPC, but the East district's own stats (loyalty/stability: 75, see
  // initialDistricts.ts) never change anywhere in the campaign, so its
  // status is always 'thriving' and any 'unstable'-phase content on him
  // was dead — no real playthrough could ever reach it. full-signal is the
  // mission whose unlock (missionCompleted: 'south-stability') is the
  // *actual* thing gating the East course (see defaultUnlockRules.ts /
  // destinationContent.getDestinationLockRequirementMissionId) — linking
  // him to it makes his dialogue track the real, reachable gate.
  'east-broker': 'full-signal',
}

/**
 * NPCs whose dialogue is a single static line rather than mission-, lesson-,
 * or district-status-driven — Kestrel Vane (only ever appears after the
 * campaign is complete) and, since Meridian 1.3, reunited-owner (only ever
 * appears after lesson:english-001 completes, and has no district-status
 * arc of her own — the same reason a single static line fits her).
 */
const STATIC_DIALOGUE_NPC_IDS: ReadonlySet<string> = new Set(['city-voice', 'reunited-owner'])

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

  // Batch 3A.4B — math-teacher/english-teacher resolve here (getLessonIdForNpc
  // only returns a value for those two ids); every other NPC falls through
  // to the district/static checks below exactly as before.
  const linkedLessonId = getLessonIdForNpc(npc.id)
  if (linkedLessonId) {
    const completed = (context.completedLessonIds ?? []).includes(linkedLessonId)
    return { kind: 'lesson', phase: completed ? 'completed' : 'available' }
  }

  if (STATIC_DIALOGUE_NPC_IDS.has(npc.id)) return { kind: 'static' }

  const districtStatus = context.districtStatusByDistrictId[npc.districtId]
  if (districtStatus) return { kind: 'district', status: districtStatus }

  return { kind: 'static' }
}
