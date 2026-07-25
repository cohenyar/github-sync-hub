import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { he } from '../i18n'
import styles from './ProtectedAdminRoute.module.css'
import { useAuth } from './useAuth'

/**
 * Frontend UX guard only — it decides what to render, not what's safe. It
 * prevents a flash of admin content and redirects politely, but it is not a
 * security boundary: any future database mutation or sensitive admin action
 * must be enforced server-side (Supabase RLS or an Edge Function), never by
 * trusting this component's `role` check alone.
 */
export function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  const { status, isAdmin } = useAuth()

  if (status === 'loading') {
    return (
      <div className={styles.loading} role="status" data-testid="admin-route-loading">
        {he.authLoadingMessage}
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
