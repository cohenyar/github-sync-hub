import type { Database } from 'sql.js'
import { useEffect, useState } from 'react'
import { createDatabase } from '../db/database'
import type { MissionConfig } from './types'

export interface MissionDatabaseState {
  db: Database | null
  error: string | null
}

/**
 * Sets up an isolated database seeded with a mission's setupSql. The
 * database factory is injectable so tests can supply a Node-friendly
 * loader instead of the browser wasm loader used in production.
 */
export function useMissionDatabase(
  mission: MissionConfig,
  createDb: () => Promise<Database> = createDatabase,
): MissionDatabaseState {
  const [state, setState] = useState<MissionDatabaseState>({ db: null, error: null })

  useEffect(() => {
    let cancelled = false
    setState({ db: null, error: null })

    createDb()
      .then((instance) => {
        instance.run(mission.setupSql)
        if (!cancelled) setState({ db: instance, error: null })
      })
      .catch((err) => {
        if (!cancelled) {
          setState({ db: null, error: err instanceof Error ? err.message : String(err) })
        }
      })

    return () => {
      cancelled = true
    }
  }, [mission, createDb])

  return state
}
