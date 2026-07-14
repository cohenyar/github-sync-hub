import type { HTMLAttributes, ReactNode } from 'react'
import styles from './primitives.module.css'

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'danger'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  children: ReactNode
}

const TONE_CLASS: Record<BadgeTone, string | undefined> = {
  neutral: undefined,
  accent: styles.badgeAccent,
  success: styles.badgeSuccess,
  danger: styles.badgeDanger,
}

export function Badge({ tone = 'neutral', className, children, ...rest }: BadgeProps) {
  const classes = [styles.badge, TONE_CLASS[tone], className].filter(Boolean).join(' ')
  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  )
}
