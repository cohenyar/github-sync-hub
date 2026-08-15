import { useEffect, useId } from 'react'
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
  // Accessibility/robustness pass — a generated, per-instance id (rather than
  // a hardcoded literal) so aria-labelledby never collides if two
  // ConfirmDialog instances ever rendered at once.
  const titleId = useId()

  // Mirrors ModalOverlay.tsx's own Escape-handling exactly, so the two
  // shared modal primitives behave consistently: Escape does the same thing
  // as the Cancel button.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div className={styles.overlay} role="presentation" onClick={onCancel}>
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className={styles.title}>
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
