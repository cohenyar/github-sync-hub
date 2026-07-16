import type { ReactNode } from 'react'
import { he } from '../i18n'
import styles from './GameDashboardShell.module.css'

export interface GameDashboardShellProps {
  /** Cinematic journey header (integrates companion + progress + CTA). */
  header: ReactNode
  /** Recent-events notifications rail (may render nothing). */
  notifications?: ReactNode
  /** World map board — full-width band. */
  worldMap: ReactNode
  /** Active mission stage — the focal primary column. */
  mission: ReactNode
  /** Quest track — supporting column. */
  questTrack: ReactNode
  /** Advisor (Odin) — supporting column. */
  advisor?: ReactNode
  /** De-emphasized dev tools (raw world-state toggle + dump). */
  devTools?: ReactNode
  /** Mobile-only sticky primary CTA action (same behavior as the header CTA). */
  onPrimary?: () => void
  /** Label for the sticky CTA. */
  primaryLabel?: string
}

/**
 * "Command Deck" composition + layered CSS-only deep-space background.
 * Layout only — no game state, no data.
 *
 * Mobile (source order): header → notifications → mission stage (console
 * right after the header) → world map → quest track → advisor → dev tools,
 * plus a sticky bottom CTA. At ≥900px it becomes a grid: the header,
 * notifications and world map span full width; the mission stage is the wide
 * primary column with the quest track + advisor in a supporting column.
 */
export function GameDashboardShell({
  header,
  notifications,
  worldMap,
  mission,
  questTrack,
  advisor,
  devTools,
  onPrimary,
  primaryLabel,
}: GameDashboardShellProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.backdrop} aria-hidden="true">
        <span className={styles.nebula} />
        <span className={styles.stars} />
      </div>

      <main className={styles.content}>
        {/* DOM/source order = the MOBILE stacking order (header → notifications
            → mission console → map → quest → advisor), so the active console
            sits right after the header with minimal scroll. On desktop the
            grid-template-areas below re-place these independently of source
            order (map becomes the full-width band above the mission). */}
        <div className={styles.headerArea}>{header}</div>
        {notifications && <div className={styles.notificationsArea}>{notifications}</div>}
        <div className={styles.missionArea}>{mission}</div>
        <div className={styles.mapArea}>{worldMap}</div>
        <div className={styles.questArea}>{questTrack}</div>
        {advisor && <div className={styles.advisorArea}>{advisor}</div>}

        {devTools && (
          <section className={styles.devArea} aria-label={he.devToolsSectionTitle}>
            <span className={styles.devToolsLabel}>{he.devToolsSectionTitle}</span>
            <div className={styles.devToolsBody}>{devTools}</div>
          </section>
        )}
      </main>

      {onPrimary && (
        <div className={styles.stickyBar}>
          <button type="button" className={styles.stickyCta} onClick={onPrimary} data-testid="sticky-continue-button">
            <span aria-hidden>▶</span>
            {primaryLabel}
          </button>
        </div>
      )}
    </div>
  )
}
