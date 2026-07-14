import type { Database } from 'sql.js'
import { verify, type Verdict } from '../verifier'
import type { MissionConfig } from './types'

export type QueryRunResult = { kind: 'verdict'; verdict: Verdict } | { kind: 'error'; message: string }

export function runQuery(db: Database, learnerSql: string, mission: MissionConfig): QueryRunResult {
  try {
    const verdict = verify(db, learnerSql, mission.referenceSql, mission.verifyOptions)
    return { kind: 'verdict', verdict }
  } catch (err) {
    return { kind: 'error', message: err instanceof Error ? err.message : String(err) }
  }
}
