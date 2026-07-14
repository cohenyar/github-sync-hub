import type { QueryRunResult } from './runQuery'
import type { MissionConfig } from './types'

export type MissionPhase = 'loading' | 'active' | 'completed' | 'error'

export interface MissionRuntimeState {
  lastResult: QueryRunResult | null
  completed: boolean
}

export interface MissionStatus {
  phase: MissionPhase
  mission: MissionConfig
  lastResult: QueryRunResult | null
  error: string | null
}

/**
 * completed seeds the runtime as already-finished — used when a player
 * revisits a mission that's already completed per their persisted
 * progress, so the local runtime never disagrees with that.
 */
export function createInitialRuntimeState(completed = false): MissionRuntimeState {
  return { lastResult: null, completed }
}

/** Completion is one-way: once true, a later failing result cannot undo it. */
export function evaluateCompletion(runtime: MissionRuntimeState, result: QueryRunResult): boolean {
  return runtime.completed || (result.kind === 'verdict' && result.verdict.pass)
}

export function applyQueryResult(runtime: MissionRuntimeState, result: QueryRunResult): MissionRuntimeState {
  return { lastResult: result, completed: evaluateCompletion(runtime, result) }
}

export function deriveMissionPhase(dbReady: boolean, dbError: string | null, completed: boolean): MissionPhase {
  if (dbError) return 'error'
  if (!dbReady) return 'loading'
  if (completed) return 'completed'
  return 'active'
}

export function buildMissionStatus(
  mission: MissionConfig,
  dbReady: boolean,
  dbError: string | null,
  runtime: MissionRuntimeState,
): MissionStatus {
  return {
    phase: deriveMissionPhase(dbReady, dbError, runtime.completed),
    mission,
    lastResult: runtime.lastResult,
    error: dbError,
  }
}
