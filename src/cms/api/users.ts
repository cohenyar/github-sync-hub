import type { CmsResult } from '../types'
import { getCmsClient, toCmsError, unavailableResult } from './shared'

export interface AdminUserSummary {
  id: string
  email: string | null
  displayName: string | null
  role: string
  joinedAt: string
}

/**
 * Read-only. Deliberately does not show progress: gameplay progress lives
 * only in the browser's localStorage (`meridian:save`) — there is no
 * server-side save/progress table today (confirmed: `profiles` is the only
 * table besides the new CMS ones), so there is nothing truthful to show
 * here. Never selects anything beyond what's already in `profiles` — no
 * auth tokens/credentials exist in this table to begin with.
 */
export async function listUsers(): Promise<CmsResult<AdminUserSummary[]>> {
  const client = await getCmsClient()
  if (!client) return unavailableResult()
  const { data, error } = await client
    .from('profiles')
    .select('id, email, display_name, role, created_at')
    .order('created_at', { ascending: false })
  if (error) return { data: null, error: toCmsError(error) }
  return {
    data: (data ?? []).map((row) => ({
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      role: row.role,
      joinedAt: row.created_at,
    })),
    error: null,
  }
}
