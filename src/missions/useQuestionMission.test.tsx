// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { MissionConfig } from './types'
import { useQuestionMission } from './useQuestionMission'

const mcMission: MissionConfig = {
  id: 'test-mc-mission',
  title: 'Test MC Mission',
  goal: 'goal',
  prompt: 'prompt',
  subjectHe: 'מתמטיקה',
  taskHe: 'שאלה לדוגמה',
  answerConfig: { type: 'multiple_choice', options: ['א', 'ב', 'ג'], correctIndex: 1 },
  successEffect: { kind: 'SET_STAT', districtId: 'core', stat: 'signal', value: 100 },
}

const shortTextMission: MissionConfig = {
  id: 'test-short-text-mission',
  title: 'Test Short Text Mission',
  goal: 'goal',
  prompt: 'prompt',
  subjectHe: 'אנגלית',
  taskHe: 'שאלה לדוגמה 2',
  answerConfig: { type: 'exact_text', acceptedAnswers: ['תשובה'] },
}

describe('useQuestionMission', () => {
  it('starts active with no result', () => {
    const { result } = renderHook(() => useQuestionMission(mcMission))
    expect(result.current.status.phase).toBe('active')
    expect(result.current.status.lastResult).toBeNull()
  })

  it('accepts the correct multiple-choice option and transitions to completed', () => {
    const { result } = renderHook(() => useQuestionMission(mcMission))

    act(() => result.current.submit('1'))

    expect(result.current.status.phase).toBe('completed')
    expect(result.current.status.lastResult).toEqual({ pass: true, submittedAnswer: '1' })
  })

  it('rejects a wrong multiple-choice option without completing the mission', () => {
    const { result } = renderHook(() => useQuestionMission(mcMission))

    act(() => result.current.submit('0'))

    expect(result.current.status.phase).toBe('active')
    expect(result.current.status.lastResult).toEqual({ pass: false, submittedAnswer: '0' })
  })

  it('accepts a correct short-text answer case/whitespace-insensitively', () => {
    const { result } = renderHook(() => useQuestionMission(shortTextMission))

    act(() => result.current.submit(' תשובה '))

    expect(result.current.status.phase).toBe('completed')
  })

  it('stays completed even if a later submission is wrong', () => {
    const { result } = renderHook(() => useQuestionMission(mcMission))

    act(() => result.current.submit('1'))
    expect(result.current.status.phase).toBe('completed')

    act(() => result.current.submit('0'))
    expect(result.current.status.phase).toBe('completed')
  })

  it('calls onComplete exactly once, even across repeated correct submissions', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useQuestionMission(mcMission, { onComplete }))

    act(() => result.current.submit('1'))
    act(() => result.current.submit('1'))

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith(mcMission)
  })

  it('calls onFailure with the submitted answer on a wrong submission', () => {
    const onFailure = vi.fn()
    const { result } = renderHook(() => useQuestionMission(mcMission, { onFailure }))

    act(() => result.current.submit('2'))

    expect(onFailure).toHaveBeenCalledTimes(1)
    expect(onFailure).toHaveBeenCalledWith(mcMission, { pass: false, submittedAnswer: '2' })
  })

  it('does not call onFailure on a correct submission', () => {
    const onFailure = vi.fn()
    const { result } = renderHook(() => useQuestionMission(mcMission, { onFailure }))

    act(() => result.current.submit('1'))

    expect(onFailure).not.toHaveBeenCalled()
  })

  it('seeds an already-completed status when initiallyCompleted is true, without calling onComplete', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useQuestionMission(mcMission, { onComplete, initiallyCompleted: true }))

    expect(result.current.status.phase).toBe('completed')
    expect(result.current.status.lastResult).toBeNull()
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('does not reset an already-passed result when a new mission OBJECT with the SAME id arrives (real difficulty differentiation)', () => {
    // resolveMissionForDifficulty.ts resolves a fresh MissionConfig object
    // (same id, different taskHe/answerConfig) whenever the player's
    // difficulty level changes. That must never wipe an already-submitted
    // pass result for the mission the player is still on.
    const { result, rerender } = renderHook(({ mission }: { mission: MissionConfig }) => useQuestionMission(mission), {
      initialProps: { mission: mcMission },
    })

    act(() => result.current.submit('1'))
    expect(result.current.status.phase).toBe('completed')
    expect(result.current.status.lastResult).toEqual({ pass: true, submittedAnswer: '1' })

    const sameIdDifferentContent: MissionConfig = { ...mcMission, taskHe: 'שאלה שונה לגמרי', answerConfig: { type: 'exact_text', acceptedAnswers: ['משהו'] } }
    rerender({ mission: sameIdDifferentContent })

    expect(result.current.status.phase).toBe('completed')
    expect(result.current.status.lastResult).toEqual({ pass: true, submittedAnswer: '1' })
  })

  it('resets to active with no result when the mission changes', () => {
    const { result, rerender } = renderHook(({ mission }: { mission: MissionConfig }) => useQuestionMission(mission), {
      initialProps: { mission: mcMission },
    })

    act(() => result.current.submit('1'))
    expect(result.current.status.phase).toBe('completed')

    rerender({ mission: shortTextMission })

    expect(result.current.status.phase).toBe('active')
    expect(result.current.status.lastResult).toBeNull()
  })

  describe('advanceToNextQuestion — question-selection fix pass', () => {
    it('clears lastResult but leaves completed untouched', () => {
      const { result } = renderHook(() => useQuestionMission(mcMission))

      act(() => result.current.submit('1'))
      expect(result.current.status.phase).toBe('completed')
      expect(result.current.status.lastResult).toEqual({ pass: true, submittedAnswer: '1' })

      act(() => result.current.advanceToNextQuestion())

      expect(result.current.status.phase).toBe('completed')
      expect(result.current.status.lastResult).toBeNull()
    })

    it('never calls onComplete again, even after answering a subsequent practice question correctly', () => {
      const onComplete = vi.fn()
      const { result } = renderHook(() => useQuestionMission(mcMission, { onComplete }))

      act(() => result.current.submit('1'))
      expect(onComplete).toHaveBeenCalledTimes(1)

      act(() => result.current.advanceToNextQuestion())
      act(() => result.current.submit('1'))

      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it('a subsequent wrong answer after advancing still calls onFailure, without ever un-completing the mission', () => {
      const onFailure = vi.fn()
      const { result } = renderHook(() => useQuestionMission(mcMission, { onFailure }))

      act(() => result.current.submit('1'))
      act(() => result.current.advanceToNextQuestion())
      act(() => result.current.submit('0'))

      expect(result.current.status.phase).toBe('completed')
      expect(result.current.status.lastResult).toEqual({ pass: false, submittedAnswer: '0' })
      expect(onFailure).toHaveBeenCalledTimes(1)
    })

    it('does nothing harmful when called before any question has ever been answered', () => {
      const { result } = renderHook(() => useQuestionMission(mcMission))

      act(() => result.current.advanceToNextQuestion())

      expect(result.current.status.phase).toBe('active')
      expect(result.current.status.lastResult).toBeNull()
    })
  })
})
