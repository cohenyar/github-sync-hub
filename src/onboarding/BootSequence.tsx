import { useEffect, useRef, useState } from 'react'
import { he } from '../i18n'
import styles from './BootSequence.module.css'

export interface BootSequenceProps {
  /** Called exactly once — either when the scripted sequence finishes on
   * its own, or immediately when Skip is clicked. Never called twice, even
   * if both happen to race. */
  onDone: () => void
}

interface BootLine {
  id: string
  text: string
  speaker?: 'odin'
}

const LOG_LINE_DURATION_MS = 1600
const ODIN_LINE_DURATION_MS = 3200

/**
 * The animated "system log" lines, then a short scripted Odin introduction.
 * This is static, linear content — not routed through the GameEvent/Odin
 * narration system (that's WorldEntered's job, once the player is actually
 * standing in the World Scene afterward). Total natural runtime here is
 * 5 * 1.6s + 3.2s ≈ 11.2s, comfortably inside the 10–15s budget.
 */
const LINES: readonly BootLine[] = [
  { id: 'log-1', text: he.bootLogInitializing },
  { id: 'log-2', text: he.bootLogConnectingAi },
  { id: 'log-3', text: he.bootLogLoadingCity },
  { id: 'log-4', text: he.bootLogDetectingRecruit },
  { id: 'log-5', text: he.bootLogConnectionEstablished },
  { id: 'odin-intro', text: he.bootOdinIntro, speaker: 'odin' },
]

function durationForIndex(index: number): number {
  return LINES[index]?.speaker === 'odin' ? ODIN_LINE_DURATION_MS : LOG_LINE_DURATION_MS
}

export function BootSequence({ onDone }: BootSequenceProps) {
  const [lineIndex, setLineIndex] = useState(0)
  const doneRef = useRef(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function finish() {
    if (doneRef.current) return
    doneRef.current = true
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    onDone()
  }

  useEffect(() => {
    if (lineIndex >= LINES.length) {
      finish()
      return
    }
    timeoutRef.current = setTimeout(() => {
      setLineIndex((current) => current + 1)
    }, durationForIndex(lineIndex))
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [lineIndex])

  const visibleLines = LINES.slice(0, Math.min(lineIndex + 1, LINES.length))

  return (
    <div className={styles.boot} data-testid="boot-sequence" role="status">
      <div className={styles.lines}>
        {visibleLines.map((line) => (
          <p key={line.id} className={line.speaker === 'odin' ? styles.odinLine : styles.logLine}>
            {line.speaker === 'odin' && <span className={styles.odinLabel}>Odin</span>}
            {line.text}
          </p>
        ))}
      </div>
      <button type="button" className={styles.skipButton} data-testid="boot-sequence-skip-button" onClick={finish}>
        {he.bootSkipAction}
      </button>
    </div>
  )
}
