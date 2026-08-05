import { describe, expect, it } from 'vitest'
import {
  advanceBlink,
  advanceGreeting,
  advancePulse,
  advanceSpeedFactor,
  advanceWalkPhase,
  computeBlinkAmount,
  computeGreetingBob,
  computeIdleLookYaw,
  computeIdlePose,
  computePulseIntensity,
  computePulseScale,
  computeSwayAngle,
  computeTalkingHeadNod,
  computeVisualFacingAngle,
  computeWalkPose,
  computeYawTowards,
  createIdleGreetingState,
  createInitialBlinkState,
  getTargetSpeedFactor,
  hashIdToPhaseSeed,
  triggerGreeting,
  triggerPulse,
} from './animationMotion'
import type { MovementInput } from './movement'

const NO_INPUT: MovementInput = { forward: false, backward: false, left: false, right: false }

describe('getTargetSpeedFactor', () => {
  it('is 0 when no key is held', () => {
    expect(getTargetSpeedFactor(NO_INPUT)).toBe(0)
  })

  it('is 1 when any movement key is held', () => {
    expect(getTargetSpeedFactor({ ...NO_INPUT, forward: true })).toBe(1)
    expect(getTargetSpeedFactor({ ...NO_INPUT, right: true })).toBe(1)
  })
})

describe('advanceSpeedFactor', () => {
  it('eases toward the target rather than snapping', () => {
    const next = advanceSpeedFactor(0, 1, 0.05)
    expect(next).toBeGreaterThan(0)
    expect(next).toBeLessThan(1)
  })

  it('converges to the target given enough time', () => {
    let value = 0
    for (let i = 0; i < 200; i += 1) value = advanceSpeedFactor(value, 1, 0.05)
    expect(value).toBeCloseTo(1, 3)
  })
})

describe('advanceWalkPhase', () => {
  it('does not advance when speedFactor is 0', () => {
    expect(advanceWalkPhase(1, 1, 0)).toBe(1)
  })

  it('advances and wraps into [0, 2π)', () => {
    const phase = advanceWalkPhase(6, 1, 1, 1)
    expect(phase).toBeGreaterThanOrEqual(0)
    expect(phase).toBeLessThan(Math.PI * 2)
  })
})

describe('computeWalkPose', () => {
  it('is fully at rest when speedFactor is 0', () => {
    const pose = computeWalkPose(1.23, 0)
    expect(pose.hipSwingL).toBeCloseTo(0, 10)
    expect(pose.hipSwingR).toBeCloseTo(0, 10)
    expect(pose.kneeBendL).toBeCloseTo(0, 10)
    expect(pose.bodyBobY).toBeCloseTo(0, 10)
  })

  it('swings the two hips in opposite directions', () => {
    const pose = computeWalkPose(Math.PI / 2, 1)
    expect(Math.sign(pose.hipSwingL)).not.toBe(Math.sign(pose.hipSwingR))
  })

  it('never bends a knee backward', () => {
    for (let phase = 0; phase < Math.PI * 2; phase += 0.3) {
      const pose = computeWalkPose(phase, 1)
      expect(pose.kneeBendL).toBeGreaterThanOrEqual(0)
      expect(pose.kneeBendR).toBeGreaterThanOrEqual(0)
    }
  })

  it('swings an arm opposite to the same-side leg', () => {
    const pose = computeWalkPose(Math.PI / 2, 1)
    expect(Math.sign(pose.shoulderSwingL)).toBe(Math.sign(pose.hipSwingR))
  })
})

describe('computeIdlePose', () => {
  it('desyncs two phase seeds', () => {
    const a = computeIdlePose(1, 0)
    const b = computeIdlePose(1, Math.PI)
    expect(a.breatheScaleY).not.toBeCloseTo(b.breatheScaleY, 5)
  })
})

describe('computeTalkingHeadNod', () => {
  it('oscillates rather than staying fixed', () => {
    const a = computeTalkingHeadNod(0)
    const b = computeTalkingHeadNod(0.2)
    expect(a).not.toBe(b)
  })
})

describe('computeVisualFacingAngle', () => {
  it('moves toward the target, not away', () => {
    const next = computeVisualFacingAngle(0, Math.PI / 2, 0.05)
    expect(next).toBeGreaterThan(0)
    expect(next).toBeLessThanOrEqual(Math.PI / 2)
  })

  it('takes the shorter path across the -π/π wrap', () => {
    const next = computeVisualFacingAngle(Math.PI - 0.1, -Math.PI + 0.1, 0.05)
    // Going the short way means moving further into positive territory,
    // not jumping down toward -π.
    expect(next).toBeGreaterThan(Math.PI - 0.1)
  })

  it('converges to the target given enough time', () => {
    let angle = 0
    for (let i = 0; i < 100; i += 1) angle = computeVisualFacingAngle(angle, 2, 0.05)
    expect(angle).toBeCloseTo(2, 2)
  })
})

describe('blink lifecycle', () => {
  it('starts closed-eyed only after its randomized interval elapses', () => {
    const rng = () => 0 // shortest possible interval
    let state = createInitialBlinkState(rng)
    expect(state.isBlinking).toBe(false)
    state = advanceBlink(state, state.timeUntilNextBlink + 0.001, rng)
    expect(state.isBlinking).toBe(true)
    state = advanceBlink(state, 0.01, rng) // one tick into the blink itself
    expect(computeBlinkAmount(state)).toBeGreaterThan(0)
  })

  it('reopens after BLINK_DURATION and schedules another blink', () => {
    const rng = () => 0
    let state = createInitialBlinkState(rng)
    state = advanceBlink(state, state.timeUntilNextBlink + 0.001, rng)
    state = advanceBlink(state, 1, rng) // well past BLINK_DURATION
    expect(state.isBlinking).toBe(false)
    expect(computeBlinkAmount(state)).toBe(0)
  })
})

describe('hashIdToPhaseSeed', () => {
  it('is deterministic for the same id', () => {
    expect(hashIdToPhaseSeed('north-warden')).toBe(hashIdToPhaseSeed('north-warden'))
  })

  it('differs across distinct ids (no accidental collision for this cast)', () => {
    const ids = ['north-warden', 'north-analyst', 'south-organizer', 'south-engineer', 'east-broker', 'archivist-mera', 'city-voice']
    const seeds = new Set(ids.map(hashIdToPhaseSeed))
    expect(seeds.size).toBe(ids.length)
  })

  it('stays within [0, 2π)', () => {
    const seed = hashIdToPhaseSeed('some-npc-id')
    expect(seed).toBeGreaterThanOrEqual(0)
    expect(seed).toBeLessThan(Math.PI * 2)
  })
})

describe('computeIdleLookYaw', () => {
  it('is bounded by MAX_LOOK_YAW', () => {
    for (let t = 0; t < 10; t += 0.7) {
      expect(Math.abs(computeIdleLookYaw(t, 0))).toBeLessThanOrEqual(0.35 + 1e-9)
    }
  })
})

describe('computeYawTowards', () => {
  it('faces -Z when the target is directly ahead in -Z', () => {
    expect(computeYawTowards({ x: 0, z: 0 }, { x: 0, z: -5 })).toBeCloseTo(0, 5)
  })

  it('returns 0 for a coincident point rather than NaN', () => {
    expect(computeYawTowards({ x: 1, z: 1 }, { x: 1, z: 1 })).toBe(0)
  })
})

describe('greeting lifecycle', () => {
  it('is silent until triggered', () => {
    expect(computeGreetingBob(createIdleGreetingState())).toBe(0)
  })

  it('plays a bounded bob and then stops', () => {
    let state = triggerGreeting()
    state = advanceGreeting(state, 0.3)
    expect(computeGreetingBob(state)).toBeGreaterThan(0)
    state = advanceGreeting(state, 10)
    expect(state.isPlaying).toBe(false)
    expect(computeGreetingBob(state)).toBe(0)
  })
})

describe('interaction pulse lifecycle', () => {
  it('is scale 1 until triggered', () => {
    expect(computePulseScale({ isPlaying: false, elapsed: 0 })).toBe(1)
  })

  it('pulses above 1 and then settles back to 1', () => {
    let state = triggerPulse()
    state = advancePulse(state, 0.05)
    expect(computePulseScale(state)).toBeGreaterThan(1)
    state = advancePulse(state, 10)
    expect(state.isPlaying).toBe(false)
    expect(computePulseScale(state)).toBe(1)
  })
})

describe('computeSwayAngle', () => {
  it('is bounded by the given amplitude', () => {
    for (let t = 0; t < 10; t += 0.6) {
      expect(Math.abs(computeSwayAngle(t, 0, 0.045))).toBeLessThanOrEqual(0.045 + 1e-9)
    }
  })

  it('desyncs across different phase seeds at the same instant', () => {
    const a = computeSwayAngle(1, 0)
    const b = computeSwayAngle(1, Math.PI / 2)
    expect(a).not.toBeCloseTo(b, 5)
  })

  it('is 0 at t=0 with no phase seed', () => {
    expect(computeSwayAngle(0, 0)).toBeCloseTo(0, 10)
  })
})

describe('computePulseIntensity', () => {
  it('oscillates around baseIntensity within the given amplitude', () => {
    for (let t = 0; t < 10; t += 0.6) {
      const value = computePulseIntensity(t, 0, 1, 0.25)
      expect(value).toBeGreaterThanOrEqual(1 - 0.25 - 1e-9)
      expect(value).toBeLessThanOrEqual(1 + 0.25 + 1e-9)
    }
  })

  it('never goes negative even for a small baseIntensity', () => {
    for (let t = 0; t < 10; t += 0.3) {
      expect(computePulseIntensity(t, 0, 0.1, 0.25)).toBeGreaterThanOrEqual(0)
    }
  })

  it('desyncs across different phase seeds at the same instant', () => {
    const a = computePulseIntensity(1, 0, 1)
    const b = computePulseIntensity(1, Math.PI / 2, 1)
    expect(a).not.toBeCloseTo(b, 5)
  })
})
