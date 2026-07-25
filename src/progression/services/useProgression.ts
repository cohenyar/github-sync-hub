import { useState } from 'react'
import { defaultCampaign, type GameCampaign } from '../../campaign'
import type { PlayerProgress } from '../types'
import { createInitialPlayerProgress } from './createInitialPlayerProgress'
import { recordLessonCompletion as applyLessonCompletion } from './recordLessonCompletion'
import { recordMissionCompletion } from './recordMissionCompletion'

export interface UseProgressionResult {
  progress: PlayerProgress
  recordCompletion: (missionId: string) => void
  /** Batch 3A.4B — the lesson-side counterpart to recordCompletion; never touches completedMissionIds/campaignProgress. */
  recordLessonCompletion: (lessonId: string) => void
  restoreProgress: (progress: PlayerProgress) => void
}

/**
 * Owns the player's progression state for a session. The Mission Manager
 * does not know this exists — callers wire useMissionManager's existing
 * onComplete callback to recordCompletion, so Progression is notified
 * without any change to Mission Manager itself.
 *
 * initialProgress lets a caller boot straight into a previously saved
 * progress (Step 23) instead of always starting fresh.
 */
export function useProgression(
  campaign: GameCampaign = defaultCampaign,
  initialProgress?: PlayerProgress,
): UseProgressionResult {
  const [progress, setProgress] = useState<PlayerProgress>(() => initialProgress ?? createInitialPlayerProgress(campaign))

  function recordCompletion(missionId: string) {
    setProgress((current) => recordMissionCompletion(current, missionId, campaign))
  }

  function recordLessonCompletion(lessonId: string) {
    setProgress((current) => applyLessonCompletion(current, lessonId))
  }

  function restoreProgress(next: PlayerProgress) {
    setProgress(next)
  }

  return { progress, recordCompletion, recordLessonCompletion, restoreProgress }
}
