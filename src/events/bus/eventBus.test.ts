import { describe, expect, it, vi } from 'vitest'
import type { GameEvent } from '../types'
import { createEventBus } from './eventBus'

function missionCompleted(missionId: string): GameEvent {
  return { type: 'MissionCompleted', missionId }
}

describe('publish / subscribe', () => {
  it('calls a subscribed handler when a matching event is published', () => {
    const bus = createEventBus()
    const handler = vi.fn()

    bus.subscribe('MissionCompleted', handler)
    bus.publish(missionCompleted('a'))

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(missionCompleted('a'))
  })

  it('does not call a handler subscribed to a different event type', () => {
    const bus = createEventBus()
    const handler = vi.fn()

    bus.subscribe('MissionStarted', handler)
    bus.publish(missionCompleted('a'))

    expect(handler).not.toHaveBeenCalled()
  })

  it('publishing with no subscribers does not throw', () => {
    const bus = createEventBus()
    expect(() => bus.publish(missionCompleted('a'))).not.toThrow()
  })
})

describe('multiple subscribers', () => {
  it('calls every handler subscribed to the same event type', () => {
    const bus = createEventBus()
    const first = vi.fn()
    const second = vi.fn()

    bus.subscribe('MissionCompleted', first)
    bus.subscribe('MissionCompleted', second)
    bus.publish(missionCompleted('a'))

    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('calls handlers in subscription order', () => {
    const bus = createEventBus()
    const calls: string[] = []

    bus.subscribe('MissionCompleted', () => calls.push('first'))
    bus.subscribe('MissionCompleted', () => calls.push('second'))
    bus.publish(missionCompleted('a'))

    expect(calls).toEqual(['first', 'second'])
  })
})

describe('unsubscribe', () => {
  it('stops a handler from receiving further events', () => {
    const bus = createEventBus()
    const handler = vi.fn()

    bus.subscribe('MissionCompleted', handler)
    bus.unsubscribe(handler)
    bus.publish(missionCompleted('a'))

    expect(handler).not.toHaveBeenCalled()
  })

  it('removes a handler from every event type it was subscribed to', () => {
    const bus = createEventBus()
    const handler = vi.fn()

    bus.subscribe('MissionCompleted', handler)
    bus.subscribe('MissionStarted', handler)
    bus.unsubscribe(handler)

    bus.publish(missionCompleted('a'))
    bus.publish({ type: 'MissionStarted', missionId: 'a' })

    expect(handler).not.toHaveBeenCalled()
  })

  it('unsubscribing a handler that was never subscribed does not throw', () => {
    const bus = createEventBus()
    expect(() => bus.unsubscribe(vi.fn())).not.toThrow()
  })

  it('a handler that unsubscribes itself mid-publish does not break the remaining handlers', () => {
    const bus = createEventBus()
    const calls: string[] = []

    const selfUnsubscribing: (event: GameEvent) => void = () => {
      calls.push('first')
      bus.unsubscribe(selfUnsubscribing)
    }
    bus.subscribe('MissionCompleted', selfUnsubscribing)
    bus.subscribe('MissionCompleted', () => calls.push('second'))

    bus.publish(missionCompleted('a'))
    expect(calls).toEqual(['first', 'second'])

    calls.length = 0
    bus.publish(missionCompleted('a'))
    expect(calls).toEqual(['second'])
  })
})

describe('event ordering', () => {
  it('delivers events to a handler in the order they were published', () => {
    const bus = createEventBus()
    const received: string[] = []

    bus.subscribe('MissionCompleted', (event) => {
      if (event.type === 'MissionCompleted') received.push(event.missionId)
    })

    bus.publish(missionCompleted('a'))
    bus.publish(missionCompleted('b'))
    bus.publish(missionCompleted('c'))

    expect(received).toEqual(['a', 'b', 'c'])
  })
})
