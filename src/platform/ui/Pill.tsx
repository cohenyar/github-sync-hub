import type { HTMLAttributes, ReactNode } from 'react'
import styles from './primitives.module.css'

export interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
}

/** Rounded filter-chip style container. */
export function Pill({ className, children, ...rest }: PillProps) {
  return (
    <span className={[styles.pill, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </span>
  )
}
