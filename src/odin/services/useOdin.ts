import { useEffect, useState } from 'react'
import { gameEventBus, type GameEvent, type GameEventBus, type GameEventType } from '../../events'
import { defaultOdinReactions } from '../reactions'
import type { OdinNarrationEntry, OdinReaction } from '../types'
import { applyOdinEvent, createInitialOdinState } from './odinNarrator'

const ODIN_SUBSCRIBED_EVENTS: readonly GameEventType[] = [
  'MissionStarted',
  'MissionCompleted',
  'ContentUnlocked',
  'CampaignCompleted',
  'WorldStateChanged',
  'QueryFailed',
  'LessonCompleted',
  'LessonFailed',
  'WorldEntered',
]

export interface UseOdinResult {
  latestMessage: string | null
  history: readonly OdinNarrationEntry[]
}

/**
 * Odin is a read-only observer: it subscribes to the bus and narrates, but
 * never publishes, never calls back into Mission Manager/Progression/
 * Unlocks, and makes no gameplay decisions.
 */
export function useOdin(
  bus: GameEventBus = gameEventBus,
  reactions: readonly OdinReaction[] = defaultOdinReactions,
): UseOdinResult {
  const [state, setState] = useState(createInitialOdinState)

  useEffect(() => {
    const handler = (event: GameEvent) => {
      setState((current) => applyOdinEvent(current, event, reactions))
    }

    for (const type of ODIN_SUBSCRIBED_EVENTS) {
      bus.subscribe(type, handler)
    }

    return () => bus.unsubscribe(handler)
  }, [bus, reactions])

  const latest = state.history[state.history.length - 1]
  return { latestMessage: latest ? latest.message : null, history: state.history }
}
