import type { UnlockTarget } from '../../unlocks'
import type { WorldState } from '../../worldState'

export interface MissionCompletedEvent {
  type: 'MissionCompleted'
  missionId: string
}

export interface MissionStartedEvent {
  type: 'MissionStarted'
  missionId: string
}

export interface WorldStateChangedEvent {
  type: 'WorldStateChanged'
  world: WorldState
}

export interface ContentUnlockedEvent {
  type: 'ContentUnlocked'
  target: UnlockTarget
}

export interface CampaignCompletedEvent {
  type: 'CampaignCompleted'
  campaignId: string
}

/**
 * Batch 3A.4B — the lesson-side counterparts to MissionCompleted. lessonId
 * is always a namespaced id (e.g. "lesson:math-001"), never a real
 * missionRegistry id, so these can never be confused with a mission event.
 * Deliberately separate types rather than reusing MissionCompleted: that
 * event is what Progression's bus handler uses to write into
 * completedMissionIds, and a lesson id must never reach that array.
 */
export interface LessonCompletedEvent {
  type: 'LessonCompleted'
  lessonId: string
}

export interface LessonFailedEvent {
  type: 'LessonFailed'
  lessonId: string
}

/**
 * Onboarding — published exactly once, only the first time a player
 * finishes (or skips) the boot sequence and actually reaches the World
 * Scene. Never published for a returning player, and never republished by
 * toggling the classic dashboard afterward (see GameApp.tsx).
 */
export interface WorldEnteredEvent {
  type: 'WorldEntered'
}

/**
 * Meridian 1.3 — Core Loop §04 collectibles. Published once, the first time
 * a given Archive Page is actually granted (see GameApp.tsx's handleLessonResult) —
 * never republished on a lesson replay, so Odin's reaction to it never repeats either.
 */
export interface ArchivePageFoundEvent {
  type: 'ArchivePageFound'
  pageId: string
}

/**
 * Meridian 1.3 — published once per app mount for a returning player only
 * (never for a first-time player's WorldEntered), so Odin can greet them
 * without replaying the onboarding greeting. See Core Loop §01.
 */
export interface SessionResumedEvent {
  type: 'SessionResumed'
}

export type GameEvent =
  | MissionCompletedEvent
  | MissionStartedEvent
  | WorldStateChangedEvent
  | ContentUnlockedEvent
  | CampaignCompletedEvent
  | LessonCompletedEvent
  | LessonFailedEvent
  | WorldEnteredEvent
  | ArchivePageFoundEvent
  | SessionResumedEvent

export type GameEventType = GameEvent['type']

export const ALL_EVENT_TYPES: readonly GameEventType[] = [
  'MissionCompleted',
  'MissionStarted',
  'WorldStateChanged',
  'ContentUnlocked',
  'CampaignCompleted',
  'LessonCompleted',
  'LessonFailed',
  'WorldEntered',
  'ArchivePageFound',
  'SessionResumed',
]
