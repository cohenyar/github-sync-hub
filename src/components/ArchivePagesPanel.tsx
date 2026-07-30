import type { ArchivePageConfig } from '../archive'
import { he } from '../i18n'
import panelStyles from './Panel.module.css'
import styles from './ArchivePagesPanel.module.css'

export interface ArchivePagesPanelProps {
  pages: readonly ArchivePageConfig[]
  onClose: () => void
}

/**
 * Meridian 1.3 — Core Loop §04 collectibles. Read-only, like NpcBioPanel:
 * no gameplay power, nothing to interact with beyond reading. Discovery
 * itself happens in the world (a lesson's consequence); this is only for
 * revisiting what's already been found.
 */
export function ArchivePagesPanel({ pages, onClose }: ArchivePagesPanelProps) {
  return (
    <section
      className={`${panelStyles.panel} ${styles.overlay}`}
      aria-label={he.archivePagesTitle}
      data-testid="archive-pages-panel"
    >
      <button
        type="button"
        className={styles.closeButton}
        onClick={onClose}
        aria-label={he.close}
        data-testid="archive-pages-close-button"
      >
        ×
      </button>
      <h2 className={panelStyles.title}>{he.archivePagesTitle}</h2>
      {pages.length === 0 ? (
        <p className={styles.empty} data-testid="archive-pages-empty">
          {he.archivePagesEmpty}
        </p>
      ) : (
        <ul className={styles.list}>
          {pages.map((page) => (
            <li key={page.id} className={styles.page} data-testid="archive-page-entry" data-page-id={page.id}>
              <h3 className={styles.pageTitle}>{page.title}</h3>
              <p className={styles.pageBody}>{page.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
