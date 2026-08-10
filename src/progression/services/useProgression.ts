import { useState } from 'react'
import { defaultCampaign, type GameCampaign } from '../../campaign'
import type { DifficultyLevel, PlayerProgress } from '../types'
import { createInitialPlayerProgress } from './createInitialPlayerProgress'
import { recordArchivePageFound as applyArchivePageFound } from './recordArchivePageFound'
import { recordLessonCompletion as applyLessonCompletion } from './recordLessonCompletion'
import { recordMissionCompletion } from './recordMissionCompletion'
import { recordNpcConversation as applyNpcConversation } from './recordNpcConversation'
import { setDifficultyLevel as applySetDifficultyLevel } from './setDifficultyLevel'
import { setPlayerProfile as applySetPlayerProfile } from './setPlayerProfile'

export interface UseProgressionResult {
  progress: PlayerProgress
  recordCompletion: (missionId: string) => void
  /** Batch 3A.4B — the lesson-side counterpart to recordCompletion; never touches completedMissionIds/campaignProgress. */
  recordLessonCompletion: (lessonId: string) => void
  /** Meridian 1.3 — one tick per NPC each time their dialogue opens; its own axis, independent of mission/lesson completion. */
  recordNpcConversation: (npcId: string) => void
  /** Meridian 1.3 — idempotent; finding an already-collected page again is a no-op. */
  recordArchivePageFound: (pageId: string) => void
  /** Meridian 1.4 — Player Identity MVP; sets the local profile's name + chosen avatar preset. */
  setPlayerProfile: (name: string, avatarId: string) => void
  /** First Mission UX pass; sets the local profile's learning difficulty — scaffolding only, never a different campaign. */
  setDifficultyLevel: (level: DifficultyLevel) => void
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

  function recordNpcConversation(npcId: string) {
    setProgress((current) => applyNpcConversation(current, npcId))
  }

  function recordArchivePageFound(pageId: string) {
    setProgress((current) => applyArchivePageFound(current, pageId))
  }

  function setPlayerProfile(name: string, avatarId: string) {
    setProgress((current) => applySetPlayerProfile(current, name, avatarId))
  }

  function setDifficultyLevel(level: DifficultyLevel) {
    setProgress((current) => applySetDifficultyLevel(current, level))
  }

  function restoreProgress(next: PlayerProgress) {
    setProgress(next)
  }

  return {
    progress,
    recordCompletion,
    recordLessonCompletion,
    recordNpcConversation,
    recordArchivePageFound,
    setPlayerProfile,
    setDifficultyLevel,
    restoreProgress,
  }
}
