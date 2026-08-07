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

/**
 * Playtest fix pass (issue 6A) — a small, deterministic classification of
 * sql.js's (SQLite's) own error message prefixes. Never surfaces the raw
 * message itself to the player (SqlEditorPanel still does that separately,
 * under sqlErrorPrefix); this only lets Odin pick a specific, actionable
 * reaction instead of one generic "check your syntax" line for every kind
 * of SQL error. No AI/LLM involved — plain substring matching.
 */
export type SqlErrorKind = 'unknown-table' | 'unknown-column' | 'syntax' | 'generic'

export function classifySqlError(message: string): SqlErrorKind {
  const lower = message.toLowerCase()
  if (lower.includes('no such table')) return 'unknown-table'
  if (lower.includes('no such column')) return 'unknown-column'
  if (lower.includes('syntax error')) return 'syntax'
  return 'generic'
}
