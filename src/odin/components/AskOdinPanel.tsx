import { useState } from 'react'
import { he } from '../../i18n'
import { resolveAskOdinAnswer, type AskOdinQuestionId } from '../services/resolveAskOdinAnswer'
import type { OdinNarrationEntry } from '../types'
import styles from './AskOdinPanel.module.css'

export interface AskOdinPanelProps {
  missionGoal: string
  missionPrompt: string
  missionHint?: string
  destinationName?: string
  /** Same history useOdin already tracks — scanned backward for the most recent QueryFailed-driven line, never mutated. */
  history: readonly OdinNarrationEntry[]
}

const QUESTIONS: ReadonlyArray<{ id: AskOdinQuestionId; label: string }> = [
  { id: 'what-now', label: he.askOdinWhatNowLabel },
  { id: 'hint', label: he.askOdinHintLabel },
  { id: 'explain-mission', label: he.askOdinExplainLabel },
  { id: 'why-failed', label: he.askOdinWhyFailedLabel },
  { id: 'where-to-go', label: he.askOdinWhereToGoLabel },
]

function findLastQueryFailedMessage(history: readonly OdinNarrationEntry[]): string | null {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    if (history[index].event.type === 'QueryFailed') return history[index].message
  }
  return null
}

/**
 * Playtest fix pass (issue 6C) — a small, deterministic help panel. No
 * "Ask Odin" entry point existed anywhere in the codebase before this (a
 * full grep turned up nothing), and per the playtest's own instructions
 * this stays deterministic — five fixed questions, each resolved from data
 * already available to the caller, no AI/LLM, no new persisted state.
 * Structurally independent of useOdin's reactive narration state (only
 * reads `history`, never writes to it), so it carries zero risk to Odin's
 * existing reaction/priority behavior or its tests.
 */
export function AskOdinPanel({ missionGoal, missionPrompt, missionHint, destinationName, history }: AskOdinPanelProps) {
  const [answer, setAnswer] = useState<string | null>(null)

  function ask(questionId: AskOdinQuestionId) {
    setAnswer(
      resolveAskOdinAnswer(questionId, {
        missionGoal,
        missionPrompt,
        missionHint,
        destinationName,
        lastQueryFailedMessage: findLastQueryFailedMessage(history),
      }),
    )
  }

  return (
    <section className={styles.panel} aria-label={he.askOdinPanelTitle} data-testid="ask-odin-panel">
      <h3 className={styles.title}>{he.askOdinPanelTitle}</h3>
      <div className={styles.buttons}>
        {QUESTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={styles.questionButton}
            data-testid={`ask-odin-${id}`}
            onClick={() => ask(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {answer && (
        <p className={styles.answer} data-testid="ask-odin-answer">
          {answer}
        </p>
      )}
    </section>
  )
}
