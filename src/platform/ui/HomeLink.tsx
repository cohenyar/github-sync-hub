import type { ReactNode } from 'react'
import { Link, useInRouterContext } from 'react-router-dom'

export interface HomeLinkProps {
  className?: string
  ariaLabel?: string
  children: ReactNode
}

/**
 * Wraps `children` in a real react-router `Link` to "/" — except when
 * rendered with no Router ancestor at all. Many existing tests mount
 * `<GameApp/>` directly with no Router wrapper (see
 * src/test/renderGameApp.tsx), and a bare `Link`/`useHref` throws outside a
 * Router. Falls back to a plain inert `<span>` there, the same
 * "degrades gracefully without its usual ancestor" contract useOptionalAuth
 * already established in this codebase for the identical reason. In every
 * real (production) mount, GameApp always has a Router ancestor via
 * App.tsx, so this is always a real, working link there.
 */
export function HomeLink({ className, ariaLabel, children }: HomeLinkProps) {
  const inRouterContext = useInRouterContext()
  if (!inRouterContext) {
    return (
      <span className={className} aria-label={ariaLabel}>
        {children}
      </span>
    )
  }
  return (
    <Link to="/" className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  )
}
