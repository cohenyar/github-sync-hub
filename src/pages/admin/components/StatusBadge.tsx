import { he } from '../../../i18n'
import type { ContentStatus } from '../../../cms'
import styles from './StatusBadge.module.css'

export function StatusBadge({ status }: { status: ContentStatus }) {
  return (
    <span className={status === 'active' ? styles.active : styles.draft}>
      {status === 'active' ? he.adminStatusActive : he.adminStatusDraft}
    </span>
  )
}
