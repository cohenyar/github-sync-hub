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

export type GameEvent =
  | MissionCompletedEvent
  | MissionStartedEvent
  | WorldStateChangedEvent
  | ContentUnlockedEvent
  | CampaignCompletedEvent
  | QueryFailedEvent

export type GameEventType = GameEvent['type']

export const ALL_EVENT_TYPES: readonly GameEventType[] = [
  'MissionCompleted',
  'MissionStarted',
  'WorldStateChanged',
  'ContentUnlocked',
  'CampaignCompleted',
  'QueryFailed',
]
