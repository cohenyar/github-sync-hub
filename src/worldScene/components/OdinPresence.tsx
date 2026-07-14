import { useEffect, useRef, useState } from 'react'
import type { OdinNarrationEntry } from '../../odin'
import styles from './OdinPresence.module.css'

export interface OdinPresenceProps {
  latestEntry: OdinNarrationEntry | null
}

const DISPLAY_DURATION_MS = 4500
const FADE_OUT_DURATION_MS = 300

/**
 * Odin's existing narration (odin/reactions), surfaced as a quiet,
 * self-dismissing subtitle over the 3D world and Terminal — no new
 * reactions, no new events, just a visible home for lines Odin already
 * generates today but that only ever reached the classic dashboard's
 * OdinPanel. Rendered once, as a sibling that stays mounted across the
 * world<->Terminal mode switch, so a line already shown doesn't reappear
 * just because the scene underneath it remounted.
 */
export function OdinPresence({ latestEntry }: OdinPresenceProps) {
  const [displayedEntry, setDisplayedEntry] = useState<OdinNarrationEntry | null>(null)
  const [visible, setVisible] = useState(false)
  const shownIdRef = useRef<string | null>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const removeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!latestEntry || latestEntry.id === shownIdRef.current) return
    shownIdRef.current = latestEntry.id

    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    if (removeTimeoutRef.current) clearTimeout(removeTimeoutRef.current)

    setDisplayedEntry(latestEntry)
    setVisible(true)

    hideTimeoutRef.current = setTimeout(() => {
      setVisible(false)
      removeTimeoutRef.current = setTimeout(() => setDisplayedEntry(null), FADE_OUT_DURATION_MS)
    }, DISPLAY_DURATION_MS)
  }, [latestEntry])

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
      if (removeTimeoutRef.current) clearTimeout(removeTimeoutRef.current)
    }
  }, [])

  if (!displayedEntry) return null

  return (
    <div
      className={`${styles.presence} ${visible ? styles.visible : styles.hidden}`}
      data-testid="odin-presence"
      role="status"
      dir="ltr"
      lang="en"
    >
      {displayedEntry.message}
    </div>
  )
}
