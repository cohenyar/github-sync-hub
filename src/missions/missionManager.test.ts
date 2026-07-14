import { describe, expect, it } from 'vitest'
import {
  applyQueryResult,
  buildMissionStatus,
  createInitialRuntimeState,
  deriveMissionPhase,
  evaluateCompletion,
} from './missionManager'
import type { QueryRunResult } from './runQuery'
import type { MissionConfig } from './types'

const mission: MissionConfig = {
  id: 'm',
  title: 'M',
  goal: 'g',
  prompt: 'p',
  setupSql: '',
  referenceSql: 'SELECT 1',
}

function verdictResult(pass: boolean): QueryRunResult {
  return { kind: 'verdict', verdict: { pass, missing: [], extra: [], orderWrong: false, expected: [], actual: [] } }
}

const errorResult: QueryRunResult = { kind: 'error', message: 'syntax error' }

describe('createInitialRuntimeState', () => {
  it('starts with no result and not completed', () => {
    expect(createInitialRuntimeState()).toEqual({ lastResult: null, completed: false })
  })

  it('can be seeded as already completed', () => {
    expect(createInitialRuntimeState(true)).toEqual({ lastResult: null, completed: true })
  })
})

describe('evaluateCompletion', () => {
  it('is true once a passing verdict is seen', () => {
    expect(evaluateCompletion({ lastResult: null, completed: false }, verdictResult(true))).toBe(true)
  })

  it('is false for a failing verdict when not already completed', () => {
    expect(evaluateCompletion({ lastResult: null, completed: false }, verdictResult(false))).toBe(false)
  })

  it('is false for a SQL error result', () => {
    expect(evaluateCompletion({ lastResult: null, completed: false }, errorResult)).toBe(false)
  })

  it('stays true once already completed, even after a failing result', () => {
    expect(evaluateCompletion({ lastResult: null, completed: true }, verdictResult(false))).toBe(true)
  })
})

describe('applyQueryResult', () => {
  it('records the result and evaluates completion', () => {
    const next = applyQueryResult({ lastResult: null, completed: false }, verdictResult(true))
    expect(next).toEqual({ lastResult: verdictResult(true), completed: true })
  })

  it('does not complete on a failing result', () => {
    const next = applyQueryResult({ lastResult: null, completed: false }, verdictResult(false))
    expect(next).toEqual({ lastResult: verdictResult(false), completed: false })
  })
})

describe('deriveMissionPhase', () => {
  it('is error when there is a database error, regardless of other flags', () => {
    expect(deriveMissionPhase(true, 'boom', true)).toBe('error')
  })

  it('is completed once the mission is completed', () => {
    expect(deriveMissionPhase(true, null, true)).toBe('completed')
  })

  it('is active once the database is ready and not completed', () => {
    expect(deriveMissionPhase(true, null, false)).toBe('active')
  })

  it('is loading while the database is not ready', () => {
    expect(deriveMissionPhase(false, null, false)).toBe('loading')
  })

  it('is loading while the database is not ready, even if the runtime was seeded as completed', () => {
    // A revisited, already-completed mission still has to wait for its own
    // database to finish preparing — completion must never imply readiness.
    expect(deriveMissionPhase(false, null, true)).toBe('loading')
  })
})

describe('buildMissionStatus', () => {
  it('combines the mission, phase, result, and error into one status object', () => {
    const runtime = { lastResult: verdictResult(true), completed: true }
    expect(buildMissionStatus(mission, true, null, runtime)).toEqual({
      phase: 'completed',
      mission,
      lastResult: verdictResult(true),
      error: null,
    })
  })
})
