import type { MovementInput, Position2D } from './movement'

/**
 * Pure animation math — no Three.js import, no rendering, fully
 * Vitest-testable, matching movement.ts's own discipline. Every function
 * here takes plain numbers/state and returns plain numbers/state; the 3D
 * components (PlayerAvatar, PlayerCharacter, NpcMarker3D) are the only
 * things that ever write a result onto a mesh/group.
 */

export const WALK_CYCLE_RATE = 6
export const MAX_HIP_SWING = 0.5
export const MAX_KNEE_BEND = 0.9
export const ARM_SWING_RATIO = 1.2
export const ELBOW_BEND_RATIO = 0.5
export const MAX_BOB = 0.05
export const SPEED_DAMP_LAMBDA = 10

export const IDLE_BREATHE_HZ = 0.35
export const BREATHE_SCALE_AMPLITUDE = 0.02
export const BREATHE_OFFSET_AMPLITUDE = 0.015
export const HEAD_SWAY_AMPLITUDE = 0.06

export const LOOK_CYCLE_HZ = 0.15
export const MAX_LOOK_YAW = 0.35

export const TURN_EASE_RATE = 18

export const BLINK_MIN_INTERVAL = 2
export const BLINK_MAX_INTERVAL = 6
export const BLINK_DURATION = 0.12

export const TALK_NOD_HZ = 1.6
export const TALK_NOD_AMPLITUDE = 0.12

export const GREETING_DURATION = 0.7
export const GREETING_BOB_AMPLITUDE = 0.12

export const PULSE_DURATION = 0.2
export const PULSE_SCALE_AMPLITUDE = 0.12

export const SWAY_HZ = 0.4
export const MAX_SWAY_ANGLE = 0.045

export const LAMP_PULSE_HZ = 0.5
export const LAMP_PULSE_AMPLITUDE = 0.25

const TWO_PI = Math.PI * 2

/** Exponential ease toward a target — same shape as THREE.MathUtils.damp, kept local so this module stays free of a three.js import. */
function dampTowards(current: number, target: number, lambda: number, deltaSeconds: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * deltaSeconds))
}

function shortestAngleDiff(from: number, to: number): number {
  let diff = (to - from) % TWO_PI
  if (diff > Math.PI) diff -= TWO_PI
  if (diff < -Math.PI) diff += TWO_PI
  return diff
}

// --- idle <-> walk blend ---

/** 1 while any movement key is held, 0 otherwise — the target the speed factor damps toward. */
export function getTargetSpeedFactor(input: MovementInput): number {
  return input.forward || input.backward || input.left || input.right ? 1 : 0
}

export function advanceSpeedFactor(
  current: number,
  targetSpeedFactor: number,
  deltaSeconds: number,
  lambda: number = SPEED_DAMP_LAMBDA,
): number {
  return dampTowards(current, targetSpeedFactor, lambda, deltaSeconds)
}

// --- walk cycle ---

export function advanceWalkPhase(
  phase: number,
  deltaSeconds: number,
  speedFactor: number,
  cycleRate: number = WALK_CYCLE_RATE,
): number {
  const next = (phase + deltaSeconds * cycleRate * speedFactor) % TWO_PI
  return next < 0 ? next + TWO_PI : next
}

export interface WalkPose {
  hipSwingL: number
  hipSwingR: number
  kneeBendL: number
  kneeBendR: number
  shoulderSwingL: number
  shoulderSwingR: number
  elbowBendL: number
  elbowBendR: number
  bodyBobY: number
}

/**
 * A stylized, not biomechanical, gait: each leg swings on a sine, its knee
 * bends only through the forward half of that same swing (a knee bending
 * backward would read as broken), and each arm counter-swings with the
 * opposite leg the way a real walk does — all scaled by speedFactor so the
 * pose settles to a dead stop, not a mid-stride freeze, once idle.
 */
export function computeWalkPose(phase: number, speedFactor: number): WalkPose {
  const hipSwingL = Math.sin(phase) * MAX_HIP_SWING * speedFactor
  const hipSwingR = Math.sin(phase + Math.PI) * MAX_HIP_SWING * speedFactor
  const kneeBendL = Math.max(0, Math.sin(phase)) * MAX_KNEE_BEND * speedFactor
  const kneeBendR = Math.max(0, Math.sin(phase + Math.PI)) * MAX_KNEE_BEND * speedFactor
  const shoulderSwingL = hipSwingR * ARM_SWING_RATIO
  const shoulderSwingR = hipSwingL * ARM_SWING_RATIO

  return {
    hipSwingL,
    hipSwingR,
    kneeBendL,
    kneeBendR,
    shoulderSwingL,
    shoulderSwingR,
    elbowBendL: Math.abs(shoulderSwingL) * ELBOW_BEND_RATIO,
    elbowBendR: Math.abs(shoulderSwingR) * ELBOW_BEND_RATIO,
    bodyBobY: Math.abs(Math.sin(phase)) * MAX_BOB * speedFactor,
  }
}

// --- idle ---

export interface IdlePose {
  breatheScaleY: number
  breatheOffsetY: number
  headSwayX: number
  headSwayZ: number
}

/** phaseSeed desyncs multiple idling characters (see hashIdToPhaseSeed) so they never breathe in lockstep. */
export function computeIdlePose(elapsedSeconds: number, phaseSeed = 0): IdlePose {
  const breathe = Math.sin(elapsedSeconds * IDLE_BREATHE_HZ * TWO_PI + phaseSeed)
  return {
    breatheScaleY: breathe * BREATHE_SCALE_AMPLITUDE,
    breatheOffsetY: breathe * BREATHE_OFFSET_AMPLITUDE,
    headSwayX: Math.sin(elapsedSeconds * LOOK_CYCLE_HZ * TWO_PI + phaseSeed * 1.7) * HEAD_SWAY_AMPLITUDE,
    headSwayZ: Math.sin(elapsedSeconds * LOOK_CYCLE_HZ * TWO_PI * 0.6 + phaseSeed * 2.3) * HEAD_SWAY_AMPLITUDE * 0.6,
  }
}

// --- talking ---

export function computeTalkingHeadNod(elapsedSeconds: number): number {
  return Math.sin(elapsedSeconds * TALK_NOD_HZ * TWO_PI) * TALK_NOD_AMPLITUDE
}

// --- turning (a new, purely visual function — computeFacingAngle in movement.ts is never modified) ---

/** Eases the rendered heading toward the logical one computed by movement.ts, taking the shorter way around. */
export function computeVisualFacingAngle(
  currentVisualAngle: number,
  targetAngle: number,
  deltaSeconds: number,
  turnRate: number = TURN_EASE_RATE,
): number {
  const diff = shortestAngleDiff(currentVisualAngle, targetAngle)
  return currentVisualAngle + diff * Math.min(1, deltaSeconds * turnRate)
}

// --- blinking ---

export interface BlinkState {
  timeUntilNextBlink: number
  blinkElapsed: number
  isBlinking: boolean
}

function randomBlinkInterval(rng: () => number): number {
  return BLINK_MIN_INTERVAL + rng() * (BLINK_MAX_INTERVAL - BLINK_MIN_INTERVAL)
}

export function createInitialBlinkState(rng: () => number = Math.random): BlinkState {
  return { timeUntilNextBlink: randomBlinkInterval(rng), blinkElapsed: 0, isBlinking: false }
}

export function advanceBlink(state: BlinkState, deltaSeconds: number, rng: () => number = Math.random): BlinkState {
  if (state.isBlinking) {
    const blinkElapsed = state.blinkElapsed + deltaSeconds
    if (blinkElapsed >= BLINK_DURATION) return { timeUntilNextBlink: randomBlinkInterval(rng), blinkElapsed: 0, isBlinking: false }
    return { ...state, blinkElapsed }
  }
  const timeUntilNextBlink = state.timeUntilNextBlink - deltaSeconds
  if (timeUntilNextBlink <= 0) return { timeUntilNextBlink: 0, blinkElapsed: 0, isBlinking: true }
  return { ...state, timeUntilNextBlink }
}

/** 0 (open) to 1 (fully closed) and back to 0 within BLINK_DURATION — the caller clamps eyelid scale, this stays a plain envelope. */
export function computeBlinkAmount(state: BlinkState): number {
  if (!state.isBlinking) return 0
  return Math.sin((state.blinkElapsed / BLINK_DURATION) * Math.PI)
}

// --- NPC idle look / notice-turn / greeting ---

/** A deterministic 0..2π seed from an npc id, so idle motion desyncs across NPCs without any shared counter. */
export function hashIdToPhaseSeed(id: string): number {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) % 1000
  }
  return (hash / 1000) * TWO_PI
}

export function computeIdleLookYaw(elapsedSeconds: number, phaseSeed: number): number {
  return Math.sin(elapsedSeconds * LOOK_CYCLE_HZ * TWO_PI + phaseSeed) * MAX_LOOK_YAW
}

/** Same "forward is -Z" convention as movement.ts's computeFacingAngle, aimed at a point instead of an input direction. */
export function computeYawTowards(from: Position2D, to: Position2D): number {
  const dx = to.x - from.x
  const dz = to.z - from.z
  if (dx === 0 && dz === 0) return 0
  return Math.atan2(-dx, -dz)
}

export interface GreetingState {
  isPlaying: boolean
  elapsed: number
}

export function createIdleGreetingState(): GreetingState {
  return { isPlaying: false, elapsed: 0 }
}

export function triggerGreeting(): GreetingState {
  return { isPlaying: true, elapsed: 0 }
}

export function advanceGreeting(state: GreetingState, deltaSeconds: number): GreetingState {
  if (!state.isPlaying) return state
  const elapsed = state.elapsed + deltaSeconds
  if (elapsed >= GREETING_DURATION) return { isPlaying: false, elapsed: 0 }
  return { isPlaying: true, elapsed }
}

export function computeGreetingBob(state: GreetingState): number {
  if (!state.isPlaying) return 0
  return Math.sin((state.elapsed / GREETING_DURATION) * Math.PI) * GREETING_BOB_AMPLITUDE
}

// --- interaction pulse ---

export interface PulseState {
  isPlaying: boolean
  elapsed: number
}

export function triggerPulse(): PulseState {
  return { isPlaying: true, elapsed: 0 }
}

export function advancePulse(state: PulseState, deltaSeconds: number): PulseState {
  if (!state.isPlaying) return state
  const elapsed = state.elapsed + deltaSeconds
  if (elapsed >= PULSE_DURATION) return { isPlaying: false, elapsed: 0 }
  return { isPlaying: true, elapsed }
}

export function computePulseScale(state: PulseState): number {
  if (!state.isPlaying) return 1
  return 1 + Math.sin((state.elapsed / PULSE_DURATION) * Math.PI) * PULSE_SCALE_AMPLITUDE
}

// --- ambient world props (World Polish pass: trees, bushes, lamps, flags, signs) ---

/** phaseSeed desyncs multiple props (see hashIdToPhaseSeed) so a row of trees/lamps never moves in lockstep. */
export function computeSwayAngle(
  elapsedSeconds: number,
  phaseSeed = 0,
  amplitude: number = MAX_SWAY_ANGLE,
  hz: number = SWAY_HZ,
): number {
  return Math.sin(elapsedSeconds * hz * TWO_PI + phaseSeed) * amplitude
}

/** Oscillates gently around baseIntensity (a material's own resting emissiveIntensity), never below 0. */
export function computePulseIntensity(
  elapsedSeconds: number,
  phaseSeed = 0,
  baseIntensity = 1,
  amplitude: number = LAMP_PULSE_AMPLITUDE,
  hz: number = LAMP_PULSE_HZ,
): number {
  return Math.max(0, baseIntensity + Math.sin(elapsedSeconds * hz * TWO_PI + phaseSeed) * amplitude)
}
