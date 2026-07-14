import type { Database } from 'sql.js'
import { useEffect, useRef, useState } from 'react'
import {
  applyQueryResult,
  buildMissionStatus,
  createInitialRuntimeState,
  type MissionRuntimeState,
  type MissionStatus,
} from './missionManager'
import { runQuery, type QueryRunResult } from './runQuery'
import type { MissionConfig } from './types'
import { useMissionDatabase } from './useMissionDatabase'

export interface UseMissionManagerOptions {
  createDb?: () => Promise<Database>
  onComplete?: (mission: MissionConfig) => void
  onFailure?: (mission: MissionConfig, result: QueryRunResult) => void
  /** Seeds the runtime as already-completed — set this from persisted progress when revisiting a finished mission. */
  initiallyCompleted?: boolean
}

export interface UseMissionManagerResult {
  status: MissionStatus
  run: (sql: string) => void
}

/**
 * The Mission Manager: loads the active mission's database, tracks its
 * runtime state, evaluates completion, and exposes a single status object
 * for the UI. All decision logic lives in the pure functions in
 * missionManager.ts — this hook only wires them to React state and to the
 * (also independently testable) useMissionDatabase lifecycle.
 */
export function useMissionManager(
  mission: MissionConfig,
  options: UseMissionManagerOptions = {},
): UseMissionManagerResult {
  const { createDb, onComplete, onFailure, initiallyCompleted = false } = options
  const { db, error } = useMissionDatabase(mission, createDb)
  const [runtime, setRuntime] = useState<MissionRuntimeState>(() => createInitialRuntimeState(initiallyCompleted))

  // Read through a ref so this effect only resets on an actual mission
  // change (not on every render where initiallyCompleted is recomputed),
  // while still seeding from its latest value at the moment of that switch.
  const initiallyCompletedRef = useRef(initiallyCompleted)
  initiallyCompletedRef.current = initiallyCompleted

  useEffect(() => {
    setRuntime(createInitialRuntimeState(initiallyCompletedRef.current))
  }, [mission])

  function run(sql: string) {
    if (!db) return
    const result = runQuery(db, sql, mission)
    const next = applyQueryResult(runtime, result)
    setRuntime(next)
    if (next.completed && !runtime.completed) {
      onComplete?.(mission)
    } else if (result.kind === 'error' || !result.verdict.pass) {
      onFailure?.(mission, result)
    }
  }

  return {
    status: buildMissionStatus(mission, Boolean(db), error, runtime),
    run,
  }
}
