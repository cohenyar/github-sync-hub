import type { PlayerProgress } from '../types'

/**
 * The lesson-side counterpart to recordMissionCompletion — deliberately
 * does not touch completedMissionIds, completions, unlockState, or
 * campaignProgress. Idempotent: completing an already-completed lesson
 * again is a no-op (returns the same progress, unchanged). Defaults a
 * missing completedLessonIds (an older save, or a fixture predating Batch
 * 3A.4B) to an empty list before appending.
 */
export function recordLessonCompletion(progress: PlayerProgress, lessonId: string): PlayerProgress {
  const existing = progress.completedLessonIds ?? []
  if (existing.includes(lessonId)) {
    return progress
  }
  return { ...progress, completedLessonIds: [...existing, lessonId] }
}
