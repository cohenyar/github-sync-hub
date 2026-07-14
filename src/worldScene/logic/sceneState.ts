import type { EntityId } from '../../types/engine'

/**
 * Pure, disposable-renderer-agnostic state for the Phase 1 interaction
 * prototype. Deliberately mirrors the project's existing pattern (see
 * missionManager.ts): all decision logic lives here as plain functions,
 * independent of React or any particular rendering technology, so it can
 * survive a renderer swap (Phase 2) even though every component in
 * worldScene/components is disposable.
 *
 * This never touches WorldState, Unlock Engine, Mission Runtime, or any
 * other engine — it only tracks *where the player currently is* and *what
 * screen is showing*, exactly like showDebug/selectedNpcId already do in
 * App.tsx.
 */
export type SceneMode = { kind: 'plaza' } | { kind: 'dialogue'; npcId: string } | { kind: 'terminal' }

export interface SceneState {
  playerDistrictId: EntityId
  mode: SceneMode
}

export function createInitialSceneState(startDistrictId: EntityId): SceneState {
  return { playerDistrictId: startDistrictId, mode: { kind: 'plaza' } }
}

/** Walking to a different district always returns to the plaza view (closes any open dialogue/terminal). */
export function moveToDistrict(_state: SceneState, districtId: EntityId): SceneState {
  return { playerDistrictId: districtId, mode: { kind: 'plaza' } }
}

export function openNpcDialogue(state: SceneState, npcId: string): SceneState {
  return { ...state, mode: { kind: 'dialogue', npcId } }
}

export function closeDialogue(state: SceneState): SceneState {
  return { ...state, mode: { kind: 'plaza' } }
}

/**
 * Entering any destination (the Hub/Records Core, or a course world like
 * North/South/East) is a single step: walk there and open its terminal.
 * Generalized from the original Core-only version — the logic was always
 * this generic, only the name implied otherwise.
 */
export function enterDestination(_state: SceneState, destinationId: EntityId): SceneState {
  return { playerDistrictId: destinationId, mode: { kind: 'terminal' } }
}

export function exitTerminal(state: SceneState): SceneState {
  return { ...state, mode: { kind: 'plaza' } }
}
