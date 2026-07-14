import type { EventHandler } from '../bus/eventBus'

/**
 * Lets Progression react to MissionCompleted via the bus instead of the
 * caller invoking recordCompletion directly. Behavior is identical either
 * way — recordCompletion is idempotent — this only changes how the call
 * reaches Progression.
 */
export function createProgressionMissionCompletedHandler(recordCompletion: (missionId: string) => void): EventHandler {
  return (event) => {
    if (event.type !== 'MissionCompleted') return
    recordCompletion(event.missionId)
  }
}
