import { useCallback, useRef, type RefObject } from 'react'
import type { MovementInput } from '../../logic/movement'

const DEAD_ZONE = 0.15
const AXIS_THRESHOLD = 0.3

const NO_INPUT: MovementInput = { forward: false, backward: false, left: false, right: false }

export interface TouchMovementController {
  inputRef: RefObject<MovementInput>
  /** dx/dz each in [-1, 1] — VirtualJoystick's own normalized drag vector. (0,0) clears every flag. */
  setJoystickVector: (dx: number, dz: number) => void
}

/**
 * Produces the same MovementInput-shape ref useWasdInput does, fed by a
 * continuous joystick vector instead of discrete key events — quantized to
 * the same 4 booleans (no analog speed) so touch and keyboard movement
 * feel identical. Analog movement would be a movement-system change; this
 * pass only adds an input source, not a new movement feel.
 */
export function useTouchMovementInput(): TouchMovementController {
  const inputRef = useRef<MovementInput>({ ...NO_INPUT })

  const setJoystickVector = useCallback((dx: number, dz: number) => {
    if (Math.hypot(dx, dz) < DEAD_ZONE) {
      inputRef.current = { ...NO_INPUT }
      return
    }
    inputRef.current = {
      forward: dz < -AXIS_THRESHOLD,
      backward: dz > AXIS_THRESHOLD,
      left: dx < -AXIS_THRESHOLD,
      right: dx > AXIS_THRESHOLD,
    }
  }, [])

  return { inputRef, setJoystickVector }
}
