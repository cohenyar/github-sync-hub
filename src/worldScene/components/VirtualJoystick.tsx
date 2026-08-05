import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import styles from './VirtualJoystick.module.css'

export interface VirtualJoystickProps {
  /** dx/dz each normalized to [-1, 1]; (0, 0) on release. */
  onChange: (dx: number, dz: number) => void
}

/** Half the base's own diameter (see .base in the CSS) — how far the thumb can travel before clamping. */
const BASE_RADIUS_PX = 48

/**
 * A fixed on-screen movement stick — Pointer Events (not raw touch events),
 * so a mouse-drag works too, which is what makes this testable/usable on a
 * desktop browser with no real touchscreen. `setPointerCapture` on press
 * keeps the drag tracked even if the finger/cursor moves outside the base's
 * own box mid-gesture.
 */
export function VirtualJoystick({ onChange }: VirtualJoystickProps) {
  const baseRef = useRef<HTMLDivElement>(null)
  const activePointerId = useRef<number | null>(null)
  const [thumbOffset, setThumbOffset] = useState({ x: 0, y: 0 })
  const [isActive, setIsActive] = useState(false)

  function updateFromPointer(clientX: number, clientY: number) {
    const base = baseRef.current
    if (!base) return
    const rect = base.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    let dx = clientX - centerX
    let dy = clientY - centerY
    const distance = Math.hypot(dx, dy)
    if (distance > BASE_RADIUS_PX) {
      dx = (dx / distance) * BASE_RADIUS_PX
      dy = (dy / distance) * BASE_RADIUS_PX
    }
    setThumbOffset({ x: dx, y: dy })
    // Screen "up" (negative Y) reads as forward, matching every other
    // top-down/isometric virtual-joystick convention — movement.ts's own
    // "forward is -Z" convention makes this a direct, unflipped mapping.
    onChange(dx / BASE_RADIUS_PX, dy / BASE_RADIUS_PX)
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    activePointerId.current = event.pointerId
    setIsActive(true)
    updateFromPointer(event.clientX, event.clientY)
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (activePointerId.current !== event.pointerId) return
    updateFromPointer(event.clientX, event.clientY)
  }

  function release(event: ReactPointerEvent<HTMLDivElement>) {
    if (activePointerId.current !== event.pointerId) return
    activePointerId.current = null
    setIsActive(false)
    setThumbOffset({ x: 0, y: 0 })
    onChange(0, 0)
  }

  return (
    <div
      ref={baseRef}
      className={styles.base}
      data-testid="virtual-joystick"
      data-active={isActive}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div className={styles.thumb} style={{ transform: `translate(${thumbOffset.x}px, ${thumbOffset.y}px)` }} />
    </div>
  )
}
