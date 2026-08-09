import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { POST_AUTH_PATH_KEY } from './AuthProvider'
import { useOptionalAuth } from './useAuth'

/**
 * Returns the user to where they were when they started Google sign-in.
 *
 * The managed OAuth round trip always comes back to the plain app origin (a
 * deep redirect_uri can land on a guarded route before the session exists),
 * so the intended path is stashed in sessionStorage at click time and
 * replayed here — but only once the session is actually hydrated. Purely
 * navigational: it never reads or writes game state.
 */
export function PostAuthRedirect() {
  const auth = useOptionalAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const status = auth?.status

  useEffect(() => {
    if (status !== 'signed-in') return
    let target: string | null = null
    try {
      target = sessionStorage.getItem(POST_AUTH_PATH_KEY)
      if (target) sessionStorage.removeItem(POST_AUTH_PATH_KEY)
    } catch {
      return
    }
    // Same-origin relative paths only — never an absolute or protocol URL.
    if (!target || !target.startsWith('/') || target.startsWith('//')) return
    if (target === location.pathname + location.search) return
    navigate(target, { replace: true })
  }, [status, navigate, location.pathname, location.search])

  return null
}
