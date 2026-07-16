import { he } from '../i18n'
import type { GameEventBannerModel } from './GameEventBanner'
import styles from './NotificationsRail.module.css'

export interface NotificationsRailProps {
  /** Transient save/load feedback (dismissible), or null. */
  transient: GameEventBannerModel | null
  /** Recent game events (from Odin's structured history), newest first. */
  recent: readonly GameEventBannerModel[]
  onDismiss: () => void
}

function Card({ model, onDismiss }: { model: GameEventBannerModel; onDismiss?: () => void }) {
  return (
    <div className={styles.note} data-tone={model.tone} role="status" data-testid="game-event-banner">
      <span aria-hidden className={styles.icon}>
        {model.icon}
      </span>
      <div className={styles.body}>
        <span className={styles.title}>{model.title}</span>
        {model.detail && (
          <span className={styles.detail} dir={model.detailDir ?? 'rtl'}>
            {model.detail}
          </span>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          className={styles.dismiss}
          aria-label={he.dismissEventLabel}
          data-testid="game-event-dismiss"
          onClick={onDismiss}
        >
          ×
        </button>
      )}
    </div>
  )
}

/**
 * Recent-events rail, presented as game notifications. Pure presentation:
 * `recent` is derived by GameApp from the SAME structured GameEvents that
 * already ride on Odin's narration history (via gameEvents.ts) — no new
 * event system, no new subscription. `transient` is the existing save/load
 * UI feedback. Renders nothing when there's nothing to show.
 */
export function NotificationsRail({ transient, recent, onDismiss }: NotificationsRailProps) {
  if (!transient && recent.length === 0) return null

  return (
    <section className={styles.rail} aria-label={he.notificationsTitle}>
      {transient && <Card model={transient} onDismiss={onDismiss} />}
      {recent.map((model) => (
        <Card key={model.key} model={model} />
      ))}
    </section>
  )
}
