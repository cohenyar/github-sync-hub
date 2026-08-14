import { useEffect } from 'react'
import type { ReactNode } from 'react'
import styles from './ModalOverlay.module.css'

export interface ModalOverlayProps {
  onDismiss: () => void
  labelledBy?: string
  children: ReactNode
}

/**
 * Admin content-authoring UX pass — creation/edit forms moved from an
 * inline panel (easy to miss below a long table, especially on mobile) into
 * a proper modal. Backdrop click and Escape both go through the same
 * `onDismiss` the Cancel button already uses, so the existing
 * unsaved-changes-warning logic in each page is reused untouched, not
 * duplicated here.
 */
export function ModalOverlay({ onDismiss, labelledBy, children }: ModalOverlayProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onDismiss()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onDismiss])

  return (
    <div className={styles.overlay} role="presentation" onClick={onDismiss}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
