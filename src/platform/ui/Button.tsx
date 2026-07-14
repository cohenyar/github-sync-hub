import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './primitives.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'ai'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

/**
 * Platform button primitive. Variants are expressed as `data-variant` on the
 * DOM so CSS owns the visual states — the React layer only decides *what*
 * variant to render, never *how* it looks.
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      data-variant={variant}
      data-size={size}
      className={[styles.button, className].filter(Boolean).join(' ')}
    >
      {leadingIcon ? <span aria-hidden>{leadingIcon}</span> : null}
      {children}
      {trailingIcon ? <span aria-hidden>{trailingIcon}</span> : null}
    </button>
  )
}
