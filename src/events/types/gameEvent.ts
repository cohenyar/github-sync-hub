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
 * Fired whenever a run produces a non-passing result — either a mismatched
 * verdict or a SQL error. Deliberately minimal: no SQL text, no error
 * details, nothing beyond what's needed to react to the fact a query
 * failed.
 */
export interface QueryFailedEvent {
  type: 'QueryFailed'
  missionId: string
  reason: 'mismatch' | 'sql-error'
}

/**
 * Batch 3A.4B — the lesson-side counterparts to MissionCompleted/QueryFailed.
 * lessonId is always a namespaced id (e.g. "lesson:math-001"), never a real
 * missionRegistry id, so these can never be confused with the SQL events
 * above. Deliberately separate types rather than reusing MissionCompleted:
 * that event is what Progression's bus handler uses to write into
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

export type GameEvent =
  | MissionCompletedEvent
  | MissionStartedEvent
  | WorldStateChangedEvent
  | ContentUnlockedEvent
  | CampaignCompletedEvent
  | QueryFailedEvent
  | LessonCompletedEvent
  | LessonFailedEvent
  | WorldEnteredEvent

export type GameEventType = GameEvent['type']

export const ALL_EVENT_TYPES: readonly GameEventType[] = [
  'MissionCompleted',
  'MissionStarted',
  'WorldStateChanged',
  'ContentUnlocked',
  'CampaignCompleted',
  'QueryFailed',
  'LessonCompleted',
  'LessonFailed',
  'WorldEntered',
]
