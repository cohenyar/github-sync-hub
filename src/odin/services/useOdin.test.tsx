// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createEventBus } from '../../events'
import type { OdinReaction } from '../types'
import { useOdin } from './useOdin'

const reactions: OdinReaction[] = [
  {
    id: 'first-contact-completed',
    trigger: { event: 'MissionCompleted', missionId: 'first-contact' },
    message: 'The signal is steady now.',
  },
  {
    id: 'district-ties-unlocked',
    trigger: { event: 'ContentUnlocked', targetType: 'mission', targetId: 'district-ties' },
    message: 'The city is beginning to respond.',
  },
  {
    id: 'query-failed-mismatch',
    trigger: { event: 'QueryFailed', reason: 'mismatch' },
    message: "The records don't match yet.",
  },
]

describe('useOdin', () => {
  it('starts with no message and empty history', () => {
    const bus = createEventBus()
    const { result } = renderHook(() => useOdin(bus, reactions))

    expect(result.current.latestMessage).toBeNull()
    expect(result.current.history).toEqual([])
  })

  it('reacts to a MissionCompleted event published on the bus', () => {
    const bus = createEventBus()
    const { result } = renderHook(() => useOdin(bus, reactions))

    act(() => bus.publish({ type: 'MissionCompleted', missionId: 'first-contact' }))

    expect(result.current.latestMessage).toBe('The signal is steady now.')
    expect(result.current.history).toHaveLength(1)
  })

  it('reacts to a ContentUnlocked event published on the bus', () => {
    const bus = createEventBus()
    const { result } = renderHook(() => useOdin(bus, reactions))

    act(() => bus.publish({ type: 'ContentUnlocked', target: { type: 'mission', id: 'district-ties' } }))

    expect(result.current.latestMessage).toBe('The city is beginning to respond.')
  })

  it('reacts to a QueryFailed event published on the bus', () => {
    const bus = createEventBus()
    const { result } = renderHook(() => useOdin(bus, reactions))

    act(() => bus.publish({ type: 'QueryFailed', missionId: 'first-contact', reason: 'mismatch' }))

    expect(result.current.latestMessage).toBe("The records don't match yet.")
  })

  it('ignores events with no matching reaction', () => {
    const bus = createEventBus()
    const { result } = renderHook(() => useOdin(bus, reactions))

    act(() => bus.publish({ type: 'MissionStarted', missionId: 'first-contact' }))

    expect(result.current.latestMessage).toBeNull()
    expect(result.current.history).toEqual([])
  })

  it('unsubscribes on unmount and stops reacting to further events', () => {
    const bus = createEventBus()
    const { result, unmount } = renderHook(() => useOdin(bus, reactions))

    unmount()
    act(() => bus.publish({ type: 'MissionCompleted', missionId: 'first-contact' }))

    // No later render exists to observe a change, but publish must not throw
    // and no state update on an unmounted component should occur.
    expect(result.current.latestMessage).toBeNull()
  })

  it('accumulates a growing history across multiple real events', () => {
    const bus = createEventBus()
    const { result } = renderHook(() => useOdin(bus, reactions))

    act(() => bus.publish({ type: 'MissionCompleted', missionId: 'first-contact' }))
    act(() => bus.publish({ type: 'ContentUnlocked', target: { type: 'mission', id: 'district-ties' } }))

    expect(result.current.history.map((entry) => entry.message)).toEqual([
      'The signal is steady now.',
      'The city is beginning to respond.',
    ])
    expect(result.current.latestMessage).toBe('The city is beginning to respond.')
  })
})
