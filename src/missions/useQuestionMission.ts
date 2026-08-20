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
  /**
   * Question-selection fix pass — clears lastResult only, leaving completed
   * untouched, so a caller can swap in a fresh practice question (a
   * different pool entry, same mission id) without resurrecting the
   * PREVIOUS question's stale pass/fail banner. Deliberately separate from
   * the [mission.id]-keyed reset effect below, which must keep preserving
   * lastResult across a same-id difficulty-driven content swap (that
   * invariant is intentional and tested — see this hook's own tests) —
   * this is only ever called explicitly, from a real "Next Question" click,
   * never implicitly from a mission/content change alone.
   */
  advanceToNextQuestion: () => void
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

  // Keyed on the mission's id, not the object reference: real difficulty
  // differentiation resolves a fresh mission object (same id, different
  // question) whenever the player's difficulty level changes (see
  // resolveMissionForDifficulty.ts), and that must not wipe an
  // already-submitted pass/fail result for the mission the player is still
  // on — only switching to an actually different mission should reset it.
  useEffect(() => {
    setRuntime({ completed: initiallyCompletedRef.current, lastResult: null })
  }, [mission.id])

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

  function advanceToNextQuestion() {
    setRuntime((current) => ({ ...current, lastResult: null }))
  }

  return {
    status: { phase: runtime.completed ? 'completed' : 'active', lastResult: runtime.lastResult },
    submit,
    advanceToNextQuestion,
  }
}
