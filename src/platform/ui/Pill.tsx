import type { HTMLAttributes, ReactNode } from 'react'
import styles from './primitives.module.css'

export type PillTone = 'neutral' | 'ai'

export interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone
  children?: ReactNode
}

/**
 * Compact status/label pill. The `ai` tone lights a small AI indicator dot
 * — this is our visual "AI is here" cue used across the platform.
 */
export function Pill({ tone = 'neutral', className, children, ...rest }: PillProps) {
  return (
    <span
      {...rest}
      data-tone={tone === 'neutral' ? undefined : tone}
      className={[styles.pill, className].filter(Boolean).join(' ')}
    >
      {children}
    </span>
  )
}
