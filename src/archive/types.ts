/**
 * Meridian 1.3 — Core Loop §04 collectibles. Zero gameplay power by design
 * (Narrative Backbone/Core Loop): a page is never required to unlock
 * anything, never checked by the Unlock Engine, and never appears in a
 * WorldEffect. Content only, mirroring MissionConfig/LessonConfig's own
 * "pure content, no engine" shape.
 */
export interface ArchivePageConfig {
  id: string
  /** The lesson whose completion grants this page. One page per lesson for now — not a general-purpose unlock condition. */
  lessonId: string
  title: string
  body: string
}
