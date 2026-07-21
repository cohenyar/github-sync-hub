import type { Database } from 'sql.js'
import { useEffect, useState } from 'react'
import { createDatabase } from '../db/database'
import type { MissionConfig } from './types'

export interface MissionDatabaseState {
  db: Database | null
  error: string | null
}

export interface UseMissionDatabaseResult extends MissionDatabaseState {
  /** Re-runs the exact same setup (same createDb + setupSql) without waiting for the mission to change. */
  retry: () => void
}

/**
 * Sets up an isolated database seeded with a mission's setupSql. The
 * database factory is injectable so tests can supply a Node-friendly
 * loader instead of the browser wasm loader used in production.
 */
export function useMissionDatabase(
  mission: MissionConfig,
  createDb: () => Promise<Database> = createDatabase,
): UseMissionDatabaseResult {
  const [state, setState] = useState<MissionDatabaseState>({ db: null, error: null })
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState({ db: null, error: null })

    createDb()
      .then((instance) => {
        instance.run(mission.setupSql)
        if (!cancelled) setState({ db: instance, error: null })
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err)
        // The raw technical error is never rendered to the player (see
        // SqlEditorPanel) — this is where it stays inspectable for
        // debugging instead.
        console.error('Mission database setup failed:', err)
        if (!cancelled) {
          setState({ db: null, error: message })
        }
      })

    return () => {
      cancelled = true
    }
    // retryToken has no meaning of its own — including it here just forces
    // this identical setup to re-run on demand, e.g. after a transient
    // failure, without waiting for the mission itself to change.
  }, [mission, createDb, retryToken])

  return { ...state, retry: () => setRetryToken((token) => token + 1) }
}
