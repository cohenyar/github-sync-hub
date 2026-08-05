import { useEffect, useRef } from 'react'
import type { MovementInput } from '../../logic/movement'
import { getTouchInput } from '../../logic/touchInput'

/**
 * A thin React binding over raw keyboard events — held keys live in a ref,
 * not state, so a keypress never triggers a React re-render; the 3D scene
 * reads this ref once per animation frame instead. The pure math this
 * drives (movement.ts) has no idea a keyboard exists.
 *
 * The returned object is a live view: each direction is true when either
 * the keyboard OR the mobile on-screen joystick (touchInput.ts) is holding
 * it, so both input methods drive the exact same movement code path.
 */
const KEY_MAP: Record<string, keyof MovementInput> = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'backward',
  ArrowDown: 'backward',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
}

const DIRECTIONS: readonly (keyof MovementInput)[] = ['forward', 'backward', 'left', 'right']

export function useWasdInput() {
  const keysRef = useRef<MovementInput>({ forward: false, backward: false, left: false, right: false })
  const mergedRef = useRef<MovementInput>(null as unknown as MovementInput)

  if (mergedRef.current === null) {
    const merged = {} as MovementInput
    for (const direction of DIRECTIONS) {
      Object.defineProperty(merged, direction, {
        enumerable: true,
        get: () => keysRef.current[direction] || getTouchInput()[direction],
      })
    }
    mergedRef.current = merged
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const key = KEY_MAP[event.code]
      if (key) keysRef.current[key] = true
    }
    function handleKeyUp(event: KeyboardEvent) {
      const key = KEY_MAP[event.code]
      if (key) keysRef.current[key] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return mergedRef
}
