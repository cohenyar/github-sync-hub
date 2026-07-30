import type { PlayerProgress } from '../types'

/**
 * Meridian 1.3 — Core Loop §04. Idempotent, mirroring recordLessonCompletion
 * exactly: finding an already-collected page again is a no-op. Defaults a
 * missing collectedArchivePageIds (an older save) to an empty list first.
 */
export function recordArchivePageFound(progress: PlayerProgress, pageId: string): PlayerProgress {
  const existing = progress.collectedArchivePageIds ?? []
  if (existing.includes(pageId)) {
    return progress
  }
  return { ...progress, collectedArchivePageIds: [...existing, pageId] }
}
