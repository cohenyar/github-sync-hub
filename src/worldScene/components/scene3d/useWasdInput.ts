import { useEffect, useRef } from 'react'
import type { MovementInput } from '../../logic/movement'

/**
 * A thin React binding over raw keyboard events — held keys live in a ref,
 * not state, so a keypress never triggers a React re-render; the 3D scene
 * reads this ref once per animation frame instead. The pure math this
 * drives (movement.ts) has no idea a keyboard exists.
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

export function useWasdInput() {
  const inputRef = useRef<MovementInput>({ forward: false, backward: false, left: false, right: false })

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const key = KEY_MAP[event.code]
      if (key) inputRef.current[key] = true
    }
    function handleKeyUp(event: KeyboardEvent) {
      const key = KEY_MAP[event.code]
      if (key) inputRef.current[key] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return inputRef
}
