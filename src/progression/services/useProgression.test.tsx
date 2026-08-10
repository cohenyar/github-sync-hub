// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { GameCampaign } from '../../campaign'
import { useProgression } from './useProgression'

const twoStageCampaign: GameCampaign = {
  id: 'test-campaign',
  title: 'Test Campaign',
  missions: [
    { order: 1, missionId: 'a' },
    { order: 2, missionId: 'b' },
  ],
}

describe('useProgression', () => {
  it('starts with the initial progress for the given campaign', () => {
    const { result } = renderHook(() => useProgression(twoStageCampaign))
    expect(result.current.progress.campaignProgress.currentMissionId).toBe('a')
    expect(result.current.progress.completedMissionIds).toEqual([])
  })

  it('updates progress when recordCompletion is called', () => {
    const { result } = renderHook(() => useProgression(twoStageCampaign))

    act(() => result.current.recordCompletion('a'))

    expect(result.current.progress.completedMissionIds).toEqual(['a'])
    expect(result.current.progress.campaignProgress.currentMissionId).toBe('b')
  })

  it('does not duplicate a completion recorded twice', () => {
    const { result } = renderHook(() => useProgression(twoStageCampaign))

    act(() => result.current.recordCompletion('a'))
    act(() => result.current.recordCompletion('a'))

    expect(result.current.progress.completedMissionIds).toEqual(['a'])
  })

  it('reaches campaign completion after every mission is recorded', () => {
    const { result } = renderHook(() => useProgression(twoStageCampaign))

    act(() => result.current.recordCompletion('a'))
    act(() => result.current.recordCompletion('b'))

    expect(result.current.progress.campaignProgress.isComplete).toBe(true)
  })

  it('boots from initialProgress when one is provided, instead of a fresh start', () => {
    const preloaded = {
      completedMissionIds: ['a'],
      completions: [{ missionId: 'a', sequence: 1 }],
      unlockState: { unlockedMissionIds: ['a', 'b'] },
      campaignProgress: { campaignId: twoStageCampaign.id, currentMissionId: 'b', isComplete: false },
    }

    const { result } = renderHook(() => useProgression(twoStageCampaign, preloaded))

    expect(result.current.progress).toEqual(preloaded)
  })

  it('updates completedLessonIds when recordLessonCompletion is called, without touching mission-side state (Batch 3A.4B)', () => {
    const { result } = renderHook(() => useProgression(twoStageCampaign))
    const before = result.current.progress

    act(() => result.current.recordLessonCompletion('lesson:math-001'))

    expect(result.current.progress.completedLessonIds).toEqual(['lesson:math-001'])
    expect(result.current.progress.completedMissionIds).toEqual(before.completedMissionIds)
    expect(result.current.progress.campaignProgress).toEqual(before.campaignProgress)
  })

  it('does not duplicate a lesson completion recorded twice', () => {
    const { result } = renderHook(() => useProgression(twoStageCampaign))

    act(() => result.current.recordLessonCompletion('lesson:math-001'))
    act(() => result.current.recordLessonCompletion('lesson:math-001'))

    expect(result.current.progress.completedLessonIds).toEqual(['lesson:math-001'])
  })

  it('updates difficultyLevel when setDifficultyLevel is called, without touching mission/lesson state (First Mission UX pass)', () => {
    const { result } = renderHook(() => useProgression(twoStageCampaign))
    const before = result.current.progress

    act(() => result.current.setDifficultyLevel(3))

    expect(result.current.progress.difficultyLevel).toBe(3)
    expect(result.current.progress.completedMissionIds).toEqual(before.completedMissionIds)
    expect(result.current.progress.campaignProgress).toEqual(before.campaignProgress)
  })

  it('replaces progress wholesale when restoreProgress is called', () => {
    const { result } = renderHook(() => useProgression(twoStageCampaign))
    act(() => result.current.recordCompletion('a'))

    const restored = {
      completedMissionIds: [],
      completions: [],
      unlockState: { unlockedMissionIds: ['a'] },
      campaignProgress: { campaignId: twoStageCampaign.id, currentMissionId: 'a', isComplete: false },
    }
    act(() => result.current.restoreProgress(restored))

    expect(result.current.progress).toEqual(restored)
  })
})
