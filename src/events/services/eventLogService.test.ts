import { describe, expect, it } from 'vitest'
import { createEventBus } from '../bus/eventBus'
import { createEventLog } from './eventLogService'

describe('createEventLog', () => {
  it('records published events with increasing sequence numbers', () => {
    const bus = createEventBus()
    const log = createEventLog(bus)

    bus.publish({ type: 'MissionCompleted', missionId: 'a' })
    bus.publish({ type: 'MissionStarted', missionId: 'a' })

    expect(log.getEntries()).toEqual([
      { event: { type: 'MissionCompleted', missionId: 'a' }, sequence: 1 },
      { event: { type: 'MissionStarted', missionId: 'a' }, sequence: 2 },
    ])
  })

  it('only records the given subset of event types when one is provided', () => {
    const bus = createEventBus()
    const log = createEventLog(bus, ['MissionCompleted'])

    bus.publish({ type: 'MissionCompleted', missionId: 'a' })
    bus.publish({ type: 'MissionStarted', missionId: 'a' })

    expect(log.getEntries()).toHaveLength(1)
    expect(log.getEntries()[0].event.type).toBe('MissionCompleted')
  })

  it('clear() empties the log without stopping recording', () => {
    const bus = createEventBus()
    const log = createEventLog(bus)

    bus.publish({ type: 'MissionCompleted', missionId: 'a' })
    log.clear()
    expect(log.getEntries()).toEqual([])

    bus.publish({ type: 'MissionCompleted', missionId: 'b' })
    expect(log.getEntries()).toHaveLength(1)
  })

  it('stop() stops recording further events', () => {
    const bus = createEventBus()
    const log = createEventLog(bus)

    bus.publish({ type: 'MissionCompleted', missionId: 'a' })
    log.stop()
    bus.publish({ type: 'MissionCompleted', missionId: 'b' })

    expect(log.getEntries()).toHaveLength(1)
  })

  it('is in-memory only: a fresh log over the same bus starts empty', () => {
    const bus = createEventBus()
    bus.publish({ type: 'MissionCompleted', missionId: 'a' })

    const log = createEventLog(bus)
    expect(log.getEntries()).toEqual([])
  })
})
