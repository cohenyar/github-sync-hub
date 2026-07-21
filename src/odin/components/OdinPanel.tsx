import { he } from '../../i18n'
import styles from './OdinPanel.module.css'
import type { OdinNarrationEntry } from '../types'

export interface OdinPanelProps {
  latestMessage: string | null
  history: readonly OdinNarrationEntry[]
}

/**
 * Purely presentational, like the other panels: all reaction logic lives
 * in odin/services. Odin only narrates — it renders no controls and takes
 * no actions.
 */
export function OdinPanel({ latestMessage, history }: OdinPanelProps) {
  const previousEntries = history.length > 1 ? [...history].slice(0, -1).reverse().slice(0, 4) : []
  // Keying on the latest entry's id (not the message text) remounts the
  // message node whenever a new line arrives, restarting the reveal
  // animation — a stable "nothing yet" key when there's no history at all.
  const latestKey = history.length > 0 ? history[history.length - 1].id : 'none'

  return (
    <section className={styles.panel} aria-label="Odin" data-testid="odin-panel">
      <h2 className={styles.title}>Odin</h2>
      <p className={styles.status}>{he.odinStatusLabel}</p>
      <p key={latestKey} className={styles.message} data-testid="odin-latest-message">
        {latestMessage ?? he.odinIdleMessage}
      </p>
      {previousEntries.length > 0 && (
        <ul className={styles.history} aria-label={he.odinHistoryAriaLabel} data-testid="odin-history">
          {previousEntries.map((entry) => (
            <li key={entry.id}>{entry.message}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
