import { useCallback } from 'react'
import { listUsers } from '../api/users'
import { useCmsCollectionState } from './shared'

/** Read-only by design (see api/users.ts) — no create/update/remove exposed. */
export function useUsers() {
  const load = useCallback(() => listUsers(), [])
  const { state, reload } = useCmsCollectionState(load)
  return { state, reload }
}
