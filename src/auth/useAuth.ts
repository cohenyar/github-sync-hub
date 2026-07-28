import { useContext } from 'react'
import { AuthContext } from './AuthProvider'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

/**
 * Same context, but returns undefined instead of throwing when there's no
 * AuthProvider ancestor. For components (like AuthButton) that are meant to
 * be droppable into any chrome location — including the many existing
 * <GameApp/> callers, mainly tests, that don't wrap in AuthProvider — a
 * missing provider should mean "render nothing," not a crash.
 */
export function useOptionalAuth() {
  return useContext(AuthContext)
}
