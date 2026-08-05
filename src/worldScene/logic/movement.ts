/**
 * Pure WASD movement math — no Three.js import, no rendering, fully
 * Vitest-testable. The 3D scene calls this every frame from inside
 * useFrame; nothing here knows a renderer exists.
 *
 * Bounds and speed match the Visual World Upgrade Sprint's approved scale:
 * a 32×32 ground plane with a 2-unit safety inset. Speed was scaled up
 * alongside the world so travel time (not just distance) stays roughly the
 * same as before the expansion.
 */
export interface Position2D {
  x: number
  z: number
}

export interface MovementInput {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
}

export const MOVEMENT_SPEED = 7

export const MOVEMENT_BOUNDS = { minX: -14, maxX: 14, minZ: -14, maxZ: 14 } as const

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * "Forward" (W) moves toward -Z — the same direction as North in the
 * approved layout, and away from the fixed camera at +Z looking inward.
 */
export function computeNextPosition(
  position: Position2D,
  input: MovementInput,
  deltaSeconds: number,
  speed: number = MOVEMENT_SPEED,
): Position2D {
  let dx = 0
  let dz = 0
  if (input.forward) dz -= 1
  if (input.backward) dz += 1
  if (input.left) dx -= 1
  if (input.right) dx += 1

  if (dx !== 0 && dz !== 0) {
    // Normalize diagonal movement so it isn't faster than a single axis.
    const length = Math.sqrt(dx * dx + dz * dz)
    dx /= length
    dz /= length
  }

  return {
    x: clamp(position.x + dx * speed * deltaSeconds, MOVEMENT_BOUNDS.minX, MOVEMENT_BOUNDS.maxX),
    z: clamp(position.z + dz * speed * deltaSeconds, MOVEMENT_BOUNDS.minZ, MOVEMENT_BOUNDS.maxZ),
  }
}

/**
 * OR-combines two input sources so either one moving the player is
 * sufficient — neither source needs to know the other exists. Used to
 * merge keyboard and a touch virtual joystick: a desktop user who also
 * happens to have a touchscreen still gets both working at once.
 */
export function mergeMovementInput(primary: MovementInput, secondary?: MovementInput | null): MovementInput {
  if (!secondary) return primary
  return {
    forward: primary.forward || secondary.forward,
    backward: primary.backward || secondary.backward,
    left: primary.left || secondary.left,
    right: primary.right || secondary.right,
  }
}

/**
 * The Y rotation (radians) that makes a "forward is -Z" avatar face the
 * held movement direction. Holds the previous angle when no keys are held,
 * so the avatar keeps facing its last heading instead of snapping to 0.
 */
export function computeFacingAngle(input: MovementInput, previousAngle: number): number {
  let dx = 0
  let dz = 0
  if (input.forward) dz -= 1
  if (input.backward) dz += 1
  if (input.left) dx -= 1
  if (input.right) dx += 1

  if (dx === 0 && dz === 0) return previousAngle

  return Math.atan2(-dx, -dz)
}
