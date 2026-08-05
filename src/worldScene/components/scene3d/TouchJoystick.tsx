import { useEffect, useRef, useState } from 'react'
import { resetTouchInput, setTouchVector } from '../../logic/touchInput'
import styles from './TouchJoystick.module.css'

const MAX_RADIUS = 46

/**
 * Mobile on-screen movement joystick.
 *
 * Rendered only on coarse-pointer (touch) devices via CSS, and drives the
 * exact same MovementInput the keyboard drives (see touchInput.ts +
 * useWasdInput) — no movement, collision or proximity logic is duplicated
 * or changed here.
 */
export function TouchJoystick() {
  const baseRef = useRef<HTMLDivElement>(null)
  const pointerIdRef = useRef<number | null>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const [isActive, setIsActive] = useState(false)

  function updateFromEvent(event: React.PointerEvent<HTMLDivElement>) {
    const base = baseRef.current
    if (!base) return
    const rect = base.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    let dx = event.clientX - centerX
    let dy = event.clientY - centerY
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance > MAX_RADIUS) {
      dx = (dx / distance) * MAX_RADIUS
      dy = (dy / distance) * MAX_RADIUS
    }
    setKnob({ x: dx, y: dy })
    setTouchVector(dx / MAX_RADIUS, dy / MAX_RADIUS)
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (pointerIdRef.current !== null) return
    pointerIdRef.current = event.pointerId
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsActive(true)
    updateFromEvent(event)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (pointerIdRef.current !== event.pointerId) return
    updateFromEvent(event)
  }

  function handlePointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    if (pointerIdRef.current !== event.pointerId) return
    pointerIdRef.current = null
    setIsActive(false)
    setKnob({ x: 0, y: 0 })
    resetTouchInput()
  }

  return (
    <div
      ref={baseRef}
      className={styles.base}
      data-testid="touch-joystick"
      data-active={isActive}
      role="application"
      aria-label="ג׳ויסטיק תנועה"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onLostPointerCapture={handlePointerEnd}
    >
      <span className={styles.ring} aria-hidden />
      <span
        className={styles.knob}
        aria-hidden
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  )
}
