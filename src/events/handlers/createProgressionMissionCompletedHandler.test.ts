import { describe, expect, it, vi } from 'vitest'
import { createEventBus } from '../bus/eventBus'
import { createProgressionMissionCompletedHandler } from './createProgressionMissionCompletedHandler'

describe('createProgressionMissionCompletedHandler', () => {
  it('calls recordCompletion with the completed mission id', () => {
    const recordCompletion = vi.fn()
    const handler = createProgressionMissionCompletedHandler(recordCompletion)

    handler({ type: 'MissionCompleted', missionId: 'first-contact' })

    expect(recordCompletion).toHaveBeenCalledExactlyOnceWith('first-contact')
  })

  it('backward compatibility: wiring through the bus calls recordCompletion exactly as a direct call would', () => {
    const recordCompletion = vi.fn()
    const bus = createEventBus()
    bus.subscribe('MissionCompleted', createProgressionMissionCompletedHandler(recordCompletion))

    bus.publish({ type: 'MissionCompleted', missionId: 'first-contact' })

    expect(recordCompletion).toHaveBeenCalledTimes(1)
    expect(recordCompletion).toHaveBeenCalledWith('first-contact')
  })
})
