import { useState } from 'react'
import { he } from '../i18n'
import type { MissionStatus } from '../missions/missionManager'
import { QueryResultTable } from './QueryResultTable'
import { VerdictBanner } from './VerdictBanner'
import styles from './Panel.module.css'

export interface SqlEditorPanelProps {
  status: MissionStatus
  onRun: (sql: string) => void
}

/**
 * Purely presentational: all mission execution logic (running the query,
 * evaluating pass/fail, tracking completion) lives in the Mission Manager
 * (useMissionManager). This component only owns the textarea's text and
 * renders whatever status it's given.
 */
export function SqlEditorPanel({ status, onRun }: SqlEditorPanelProps) {
  const [sql, setSql] = useState('')
  const canRun = status.phase === 'active' || status.phase === 'completed'

  return (
    <section className={styles.panel} aria-label={he.sqlEditorLabel}>
      <h2 className={styles.title}>{he.sqlEditorTitle}</h2>
      <textarea
        className={styles.textarea}
        data-testid="sql-input"
        // SQL is always written left-to-right regardless of the document's
        // own RTL direction — code, not prose.
        dir="ltr"
        value={sql}
        onChange={(event) => setSql(event.target.value)}
        placeholder="-- write your query here"
        rows={8}
      />
      <button
        type="button"
        className={styles.runButton}
        data-testid="run-button"
        onClick={() => onRun(sql)}
        disabled={!canRun}
      >
        Run
      </button>

      {status.phase === 'error' && (
        <p className={styles.error} data-testid="db-prepare-error">
          Failed to prepare database: {status.error}
        </p>
      )}

      {status.lastResult?.kind === 'error' && (
        <p className={styles.error} data-testid="sql-error-message">
          SQL error: {status.lastResult.message}
        </p>
      )}

      {status.lastResult?.kind === 'verdict' && (
        <div className={styles.result}>
          <VerdictBanner verdict={status.lastResult.verdict} />
          <QueryResultTable rows={status.lastResult.verdict.actual} />
        </div>
      )}
    </section>
  )
}
