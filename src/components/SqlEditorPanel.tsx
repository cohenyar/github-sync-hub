import { useState } from 'react'
import { he } from '../i18n'
import type { MissionStatus } from '../missions/missionManager'
import type { DifficultyLevel } from '../progression/types'
import { QueryResultTable } from './QueryResultTable'
import { VerdictBanner } from './VerdictBanner'
import styles from './Panel.module.css'

export interface SqlEditorPanelProps {
  status: MissionStatus
  onRun: (sql: string) => void
  /** Re-attempts mission database preparation after a setup failure. Omitted entirely if no retry path exists. */
  onRetry?: () => void
  /**
   * First Mission UX pass — Easy (1) shows the static syntax example;
   * Medium/Hard (2/3, and the default when omitted entirely — every
   * existing caller/test that predates this prop) hide it, matching the
   * "no example shown by default" / "no example" spec for those levels.
   */
  difficultyLevel?: DifficultyLevel
}

/**
 * Purely presentational: all mission execution logic (running the query,
 * evaluating pass/fail, tracking completion) lives in the Mission Manager
 * (useMissionManager). This component only owns the textarea's text and
 * renders whatever status it's given.
 */
export function SqlEditorPanel({ status, onRun, onRetry, difficultyLevel }: SqlEditorPanelProps) {
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
        placeholder={he.sqlPlaceholder}
        // First Mission UX pass — was 8; every real query in this campaign
        // is one or two lines, and the textarea already supports
        // resize:vertical for anyone who wants more room. A shorter default
        // leaves more of the first viewport for the actual Run button.
        rows={4}
      />
      {/* Playtest fix pass (issue 5) — one static, generic (non-spoiler)
          syntax example, since the screen previously offered no example or
          hint of any kind before the player's first attempt. First Mission
          UX pass — now Easy-only; Medium/Hard hide it by default (the
          player can still write correct SQL without it; Ask Odin's hint
          stays available at every level). */}
      {difficultyLevel === 1 && (
        <p className={styles.hint} data-testid="sql-example-hint" dir="ltr">
          {he.sqlExampleHint}
        </p>
      )}
      <button
        type="button"
        className={styles.runButton}
        data-testid="run-button"
        onClick={() => onRun(sql)}
        disabled={!canRun}
      >
        {he.run}
      </button>

      {status.phase === 'error' && (
        <>
          {/* status.error (the raw technical exception) is intentionally
              never rendered here — the player only ever sees a clear
              Hebrew message. The technical detail is preserved on
              MissionStatus and logged via console.error for debugging. */}
          <p className={styles.error} data-testid="db-prepare-error">
            {he.databasePrepareErrorMessage}
          </p>
          {onRetry && (
            <button type="button" className={styles.runButton} data-testid="retry-database-button" onClick={onRetry}>
              {he.retryDatabaseSetup}
            </button>
          )}
        </>
      )}

      {status.lastResult?.kind === 'error' && (
        <p className={styles.error} data-testid="sql-error-message">
          {he.sqlErrorPrefix}{status.lastResult.message}
        </p>
      )}

      {status.lastResult?.kind === 'verdict' && (
        <div className={styles.result}>
          <VerdictBanner verdict={status.lastResult.verdict} difficultyLevel={difficultyLevel} />
          <QueryResultTable rows={status.lastResult.verdict.actual} />
        </div>
      )}
    </section>
  )
}
