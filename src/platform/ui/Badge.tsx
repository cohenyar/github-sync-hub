import type { HTMLAttributes, ReactNode } from 'react'
import styles from './primitives.module.css'

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'ai'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  children?: ReactNode
}

export function Badge({ tone = 'neutral', className, children, ...rest }: BadgeProps) {
  return (
    <span
      {...rest}
      data-tone={tone === 'neutral' ? undefined : tone}
      className={[styles.badge, className].filter(Boolean).join(' ')}
    >
      {children}
    </span>
  )
}
