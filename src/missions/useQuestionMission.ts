import { useEffect, useRef, useState } from 'react'
import { checkQuestionAnswer } from './checkQuestionAnswer'
import type { MissionConfig } from './types'

export type QuestionMissionPhase = 'active' | 'completed'

export interface QuestionAttemptResult {
  pass: boolean
  submittedAnswer: string
}

export interface QuestionMissionStatus {
  phase: QuestionMissionPhase
  lastResult: QuestionAttemptResult | null
}

export interface UseQuestionMissionOptions {
  onComplete?: (mission: MissionConfig) => void
  onFailure?: (mission: MissionConfig, result: QuestionAttemptResult) => void
  /** Seeds the runtime as already-completed — set from persisted progress when revisiting a finished mission. */
  initiallyCompleted?: boolean
}

export interface UseQuestionMissionResult {
  status: QuestionMissionStatus
  submit: (answer: string) => void
}

interface QuestionRuntimeState {
  completed: boolean
  lastResult: QuestionAttemptResult | null
}

/**
 * The mission runtime: no async database, no Verifier, just a synchronous
 * pass/fail check (see checkQuestionAnswer.ts). Mirrors the shape a richer
 * runtime would have (status/onComplete/onFailure/initiallyCompleted) so
 * GameApp's surrounding wiring (progression recording, event publishing,
 * campaign advancement) stays simple.
 */
export function useQuestionMission(
  mission: MissionConfig,
  options: UseQuestionMissionOptions = {},
): UseQuestionMissionResult {
  const { onComplete, onFailure, initiallyCompleted = false } = options
  const [runtime, setRuntime] = useState<QuestionRuntimeState>(() => ({
    completed: initiallyCompleted,
    lastResult: null,
  }))

  // Read through a ref so this effect only resets on an actual mission
  // change (not on every render where initiallyCompleted is recomputed),
  // while still seeding from its latest value at the moment of that switch.
  const initiallyCompletedRef = useRef(initiallyCompleted)
  initiallyCompletedRef.current = initiallyCompleted

  useEffect(() => {
    setRuntime({ completed: initiallyCompletedRef.current, lastResult: null })
  }, [mission])

  function submit(answer: string) {
    const pass = checkQuestionAnswer(mission.answerConfig, answer)
    const result: QuestionAttemptResult = { pass, submittedAnswer: answer }
    const wasCompleted = runtime.completed
    const nextCompleted = wasCompleted || pass
    setRuntime({ completed: nextCompleted, lastResult: result })
    if (nextCompleted && !wasCompleted) {
      onComplete?.(mission)
    } else if (!pass) {
      onFailure?.(mission, result)
    }
  }

  return {
    status: { phase: runtime.completed ? 'completed' : 'active', lastResult: runtime.lastResult },
    submit,
  }
}
