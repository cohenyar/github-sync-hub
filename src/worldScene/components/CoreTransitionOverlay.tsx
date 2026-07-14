import { useEffect, useRef, useState } from 'react'
import styles from './CoreTransitionOverlay.module.css'

export interface CoreTransitionOverlayProps {
  active: boolean
  glowColor: string
}

const PULSE_DURATION_MS = 450

/**
 * A brief full-view dim-and-color pulse timed to the exact moment the
 * player crosses the threshold between the plaza and the Records Core
 * Terminal, in either direction. The mode switch itself stays instant and
 * unchanged (App.tsx's orchestration is untouched) — this is a purely
 * decorative overlay, rendered as a persistent sibling so it never unmounts
 * across the switch, that reacts to the same `active` flag turning on or
 * off. glowColor ties the pulse to the Core's current status color, the
 * same one TerminalView's ambient framing uses, for continuity between
 * "outside" and "inside."
 */
export function CoreTransitionOverlay({ active, glowColor }: CoreTransitionOverlayProps) {
  const [pulsing, setPulsing] = useState(false)
  const previousActiveRef = useRef(active)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (previousActiveRef.current === active) return
    previousActiveRef.current = active

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setPulsing(true)
    timeoutRef.current = setTimeout(() => setPulsing(false), PULSE_DURATION_MS)
  }, [active])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div
      className={`${styles.overlay} ${pulsing ? styles.pulsing : ''}`}
      style={{ '--core-glow': glowColor } as React.CSSProperties}
      data-testid="core-transition-overlay"
      data-pulsing={pulsing}
      aria-hidden="true"
    />
  )
}
