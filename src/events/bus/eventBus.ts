import type { GameEvent, GameEventType } from '../types'

export type EventHandler = (event: GameEvent) => void

export interface GameEventBus {
  publish: (event: GameEvent) => void
  subscribe: (type: GameEventType, handler: EventHandler) => void
  unsubscribe: (handler: EventHandler) => void
}

/**
 * A minimal synchronous pub/sub bus. Lets independent systems (Progression,
 * the Unlock Engine, future systems) react to gameplay without importing or
 * calling each other directly.
 */
export function createEventBus(): GameEventBus {
  const handlersByType = new Map<GameEventType, Set<EventHandler>>()

  function publish(event: GameEvent): void {
    const handlers = handlersByType.get(event.type)
    if (!handlers) return
    // Snapshot before iterating so a handler unsubscribing mid-publish is safe.
    for (const handler of [...handlers]) {
      handler(event)
    }
  }

  function subscribe(type: GameEventType, handler: EventHandler): void {
    if (!handlersByType.has(type)) {
      handlersByType.set(type, new Set())
    }
    handlersByType.get(type)!.add(handler)
  }

  function unsubscribe(handler: EventHandler): void {
    for (const handlers of handlersByType.values()) {
      handlers.delete(handler)
    }
  }

  return { publish, subscribe, unsubscribe }
}

/** Shared bus for the live app. Tests should create their own via createEventBus() for isolation. */
export const gameEventBus: GameEventBus = createEventBus()
