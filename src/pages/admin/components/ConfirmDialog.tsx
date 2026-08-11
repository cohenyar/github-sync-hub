import { he } from '../../../i18n'
import styles from './ConfirmDialog.module.css'

export interface ConfirmDialogProps {
  title: string
  body: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Shared modal for both "delete this row?" and "discard unsaved changes?" — the two confirmation moments the admin spec calls for. */
export function ConfirmDialog({ title, body, confirmLabel, cancelLabel, danger, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className={styles.overlay} role="presentation" onClick={onCancel}>
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className={styles.title}>
          {title}
        </h2>
        <p className={styles.body}>{body}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.cancelButton} onClick={onCancel}>
            {cancelLabel ?? he.adminCancelAction}
          </button>
          <button
            type="button"
            className={danger ? styles.dangerButton : styles.confirmButton}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel ?? he.adminDeleteConfirmYes}
          </button>
        </div>
      </div>
    </div>
  )
}
