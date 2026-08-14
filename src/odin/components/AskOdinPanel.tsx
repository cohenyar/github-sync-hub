import { useState, type FormEvent } from 'react'
import { he } from '../../i18n'
import type { DifficultyLevel } from '../../progression/types'
import { resolveAskOdinAnswer, type AskOdinLastResult, type AskOdinQuestionId } from '../services/resolveAskOdinAnswer'
import { resolveFreeTextQuestion } from '../services/resolveFreeTextQuestion'
import styles from './AskOdinPanel.module.css'

export interface AskOdinPanelProps {
  subjectHe: string
  missionGoal: string
  missionPrompt: string
  missionTask: string
  missionHint?: string
  guidanceLevel1?: string
  guidanceLevel2?: string
  guidanceLevel3?: string
  destinationName?: string
  /** The player's most recent submission on the active mission, if any yet this session. */
  lastResult: AskOdinLastResult | null
  difficultyLevel?: DifficultyLevel
}

const QUESTIONS: ReadonlyArray<{ id: AskOdinQuestionId; label: string }> = [
  { id: 'what-now', label: he.askOdinWhatNowLabel },
  { id: 'hint', label: he.askOdinHintLabel },
  { id: 'explain-question', label: he.askOdinExplainLabel },
  { id: 'why-wrong', label: he.askOdinWhyWrongLabel },
  { id: 'subject', label: he.askOdinSubjectLabel },
  { id: 'where-to-go', label: he.askOdinWhereToGoLabel },
]

/**
 * Odin's deterministic help panel — General educational assistant pass:
 * generalized from the earlier SQL-era "Ask Odin" (which only knew about
 * missions/queries) to History/English/Math, plus a simple free-text input
 * (see resolveFreeTextQuestion.ts). Still no AI/LLM, no external network
 * call, no new persisted state: every answer is resolved synchronously from
 * props GameApp already computes from the active mission and progress.
 */
export function AskOdinPanel({
  subjectHe,
  missionGoal,
  missionPrompt,
  missionTask,
  missionHint,
  guidanceLevel1,
  guidanceLevel2,
  guidanceLevel3,
  destinationName,
  lastResult,
  difficultyLevel,
}: AskOdinPanelProps) {
  const [answer, setAnswer] = useState<string | null>(null)
  const [freeText, setFreeText] = useState('')

  const context = {
    subjectHe,
    missionGoal,
    missionPrompt,
    missionHint,
    guidanceLevel1,
    guidanceLevel2,
    guidanceLevel3,
    destinationName,
    lastResult,
    difficultyLevel,
  }

  function ask(questionId: AskOdinQuestionId) {
    setAnswer(resolveAskOdinAnswer(questionId, context))
  }

  function handleFreeTextSubmit(event: FormEvent) {
    event.preventDefault()
    if (freeText.trim().length === 0) return
    setAnswer(resolveFreeTextQuestion(freeText, { ...context, missionTask }))
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
      <form className={styles.freeTextForm} onSubmit={handleFreeTextSubmit}>
        <input
          className={styles.freeTextInput}
          type="text"
          value={freeText}
          onChange={(event) => setFreeText(event.target.value)}
          placeholder={he.askOdinFreeTextPlaceholder}
          aria-label={he.askOdinFreeTextLabel}
          data-testid="ask-odin-free-text-input"
        />
        <button
          type="submit"
          className={styles.freeTextSubmitButton}
          data-testid="ask-odin-free-text-submit"
          disabled={freeText.trim().length === 0}
        >
          {he.askOdinFreeTextSubmitCta}
        </button>
      </form>
      {answer && (
        <p className={styles.answer} data-testid="ask-odin-answer">
          {answer}
        </p>
      )}
    </section>
  )
}
