import type { EventHandler, GameEventBus } from '../bus/eventBus'
import { ALL_EVENT_TYPES, type GameEvent, type GameEventType } from '../types'

export interface EventLogEntry {
  event: GameEvent
  sequence: number
}

export interface EventLog {
  getEntries: () => readonly EventLogEntry[]
  clear: () => void
  stop: () => void
}

/** In-memory only, for debugging — never persisted, never survives a reload. */
export function createEventLog(bus: GameEventBus, types: readonly GameEventType[] = ALL_EVENT_TYPES): EventLog {
  const entries: EventLogEntry[] = []
  let sequence = 0

  const record: EventHandler = (event) => {
    sequence += 1
    entries.push({ event, sequence })
  }

  for (const type of types) {
    bus.subscribe(type, record)
  }

  return {
    getEntries: () => entries,
    clear: () => {
      entries.length = 0
    },
    stop: () => {
      bus.unsubscribe(record)
    },
  }
}
