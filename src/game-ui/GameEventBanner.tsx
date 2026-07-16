import { he } from '../i18n'
import styles from './GameEventBanner.module.css'

export type GameEventTone = 'success' | 'ai' | 'warning' | 'info'

export interface GameEventBannerModel {
  /** Stable key so re-rendering the same event doesn't replay the reveal. */
  key: string
  tone: GameEventTone
  icon: string
  title: string
  /** Optional secondary line (e.g. the mission/NPC name involved), LTR when it's a proper noun. */
  detail?: string
  detailDir?: 'ltr' | 'rtl'
}

export interface GameEventBannerProps {
  event: GameEventBannerModel | null
  onDismiss: () => void
}

/**
 * A single transient feedback surface for things that just happened
 * (mission completed/unlocked, NPC unlocked, campaign done, query failed,
 * save/load, next step available). It renders whatever GameApp resolved from
 * EXISTING state (Odin's structured event history + save/load UI flags) —
 * it subscribes to nothing and owns no event system of its own.
 */
export function GameEventBanner({ event, onDismiss }: GameEventBannerProps) {
  if (!event) return null

  return (
    <div
      key={event.key}
      className={styles.banner}
      data-tone={event.tone}
      role="status"
      data-testid="game-event-banner"
    >
      <span aria-hidden className={styles.icon}>
        {event.icon}
      </span>
      <div className={styles.body}>
        <span className={styles.title}>{event.title}</span>
        {event.detail && (
          <span className={styles.detail} dir={event.detailDir ?? 'rtl'}>
            {event.detail}
          </span>
        )}
      </div>
      <button
        type="button"
        className={styles.dismiss}
        aria-label={he.dismissEventLabel}
        data-testid="game-event-dismiss"
        onClick={onDismiss}
      >
        ×
      </button>
    </div>
  )
}
