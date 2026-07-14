import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './primitives.module.css'

export type ButtonVariant = 'primary' | 'ghost' | 'glass' | 'danger'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: styles.variantPrimary,
  ghost: styles.variantGhost,
  glass: styles.variantGlass,
  danger: styles.variantDanger,
}

/** Minimal platform button — one of four visual variants. */
export function Button({ variant = 'primary', className, children, ...rest }: ButtonProps) {
  const classes = [styles.button, VARIANT_CLASS[variant], className].filter(Boolean).join(' ')
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  )
}
