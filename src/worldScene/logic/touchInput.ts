import type { MovementInput } from './movement'

/**
 * Shared, module-level touch/joystick movement state.
 *
 * The on-screen joystick (mobile only) writes here; useWasdInput merges it
 * with held keyboard keys so the per-frame game loop in PlayerAvatar keeps
 * reading a single MovementInput and the pure movement math (movement.ts)
 * stays completely unaware that touch input exists.
 */
const state: MovementInput = { forward: false, backward: false, left: false, right: false }

/** Below this normalized magnitude the stick counts as centered (dead zone). */
export const JOYSTICK_DEAD_ZONE = 0.22

export function getTouchInput(): Readonly<MovementInput> {
  return state
}

/**
 * Converts a normalized stick vector (screen space: +x right, +y down,
 * magnitude 0..1) into the same four booleans the keyboard produces.
 */
export function setTouchVector(x: number, y: number): void {
  const magnitude = Math.sqrt(x * x + y * y)
  if (magnitude < JOYSTICK_DEAD_ZONE) {
    resetTouchInput()
    return
  }
  // A direction counts as held once the stick leans meaningfully that way,
  // which makes diagonals reachable without demanding a perfect 45°.
  const threshold = magnitude * 0.38
  state.forward = -y > threshold
  state.backward = y > threshold
  state.left = -x > threshold
  state.right = x > threshold
}

export function resetTouchInput(): void {
  state.forward = false
  state.backward = false
  state.left = false
  state.right = false
}
