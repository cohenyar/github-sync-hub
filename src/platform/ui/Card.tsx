import type { HTMLAttributes, ReactNode } from 'react'
import styles from './primitives.module.css'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

/** Base surface card. Composition-friendly — no built-in header/footer. */
export function Card({ className, children, ...rest }: CardProps) {
  return (
    <div className={[styles.card, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  )
}
