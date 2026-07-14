import type { HTMLAttributes, ReactNode } from 'react'
import styles from './primitives.module.css'

export type CardTone = 'default' | 'accent' | 'ai'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone
  children?: ReactNode
}

/** Glass-surface container used by every non-/world screen. */
export function Card({ tone = 'default', className, children, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      data-tone={tone === 'default' ? undefined : tone}
      className={[styles.card, className].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  )
}
