import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js'
import { cloudClientPromise } from '../../auth/supabaseClient'
import { he } from '../../i18n'
import type { Database } from '../../integrations/supabase/types'
import type { CmsTables } from '../databaseTypes'
import type { CmsResult } from '../types'

/**
 * The real generated `Database` type (untouched — see databaseTypes.ts)
 * doesn't know about courses/lessons/missions yet. This overlays the local
 * CmsTables shapes onto it purely at the type level, so every `.from(...)`
 * call in src/cms/** gets real checking without editing generated code. The
 * runtime client is exactly the same one AuthProvider uses — only the
 * compile-time view of it is wider here.
 *
 * Written as a flat literal type, not `Omit<Database, ...> & {...}` — an
 * intersection built through Omit made supabase-js's own generic table
 * lookup collapse to `never` for every table, including the untouched
 * `profiles` one, so this spells out each `public` field explicitly instead.
 * The one real cost: a table Lovable adds to `Database` later needs a
 * matching line added here too — acceptable for a file that's meant to be
 * deleted once real codegen catches up.
 */
type CmsDatabase = {
  __InternalSupabase: Database['__InternalSupabase']
  public: {
    Tables: Database['public']['Tables'] & CmsTables
    Views: Database['public']['Views']
    Functions: Database['public']['Functions']
    Enums: Database['public']['Enums']
    CompositeTypes: Database['public']['CompositeTypes']
  }
}

export type CmsClient = SupabaseClient<CmsDatabase>

/** Every CMS API function starts here — same "await the one shared client, never throw" convention as AuthProvider's own actions. */
export async function getCmsClient(): Promise<CmsClient | null> {
  const client = await cloudClientPromise
  return client as unknown as CmsClient | null
}

export function toCmsError(error: PostgrestError | { message: string } | null): string | null {
  if (!error) return null
  // The raw Postgres/PostgREST message (e.g. a check-constraint or RLS
  // denial) is logged for debugging but never shown as-is — same
  // never-leak-the-raw-technical-message convention as sqlErrorPrefix
  // elsewhere in the app.
  console.error('[meridian][cms] request failed', error)
  return he.cmsGenericError
}

export function unavailableResult<T>(): CmsResult<T> {
  return { data: null, error: he.cmsUnavailableMessage }
}
