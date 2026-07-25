import { useState, type FormEvent } from 'react'
import { he } from '../../i18n'
import { checkMathAnswer } from '../verifiers/mathVerifier'
import type { MathLessonConfig } from '../types'
import styles from './ExercisePanel.module.css'

export interface MathExercisePanelProps {
  lesson: MathLessonConfig
  onResult?: (pass: boolean) => void
}

/**
 * Pure, standalone exercise UI — no dependency on missions, useMissionManager,
 * or runQuery. Verification is local and deterministic (see mathVerifier.ts).
 */
export function MathExercisePanel({ lesson, onResult }: MathExercisePanelProps) {
  const [answer, setAnswer] = useState('')
  const [verdict, setVerdict] = useState<'pass' | 'fail' | null>(null)
  const [showHint, setShowHint] = useState(false)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const result = checkMathAnswer(lesson.exercise, answer)
    setVerdict(result.pass ? 'pass' : 'fail')
    onResult?.(result.pass)
  }

  return (
    <div className={styles.panel} data-testid="math-exercise-panel">
      <p className={styles.instructions}>{lesson.instructions}</p>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.item}>
          <span className={styles.itemLabel}>{he.mathAnswerLabel}</span>
          <input
            className={styles.input}
            type="number"
            inputMode="numeric"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            aria-label={he.mathAnswerLabel}
            data-testid="math-answer-input"
          />
        </label>
        <button className={styles.submitButton} type="submit" data-testid="math-submit-button">
          {he.submitAnswerCta}
        </button>
      </form>
      {verdict === 'pass' && (
        <p className={styles.feedbackPass} data-testid="math-exercise-feedback">
          {he.exerciseCorrectFeedback}
        </p>
      )}
      {verdict === 'fail' && (
        <p className={styles.feedbackFail} data-testid="math-exercise-feedback">
          {he.exerciseIncorrectFeedback}
        </p>
      )}
      <button
        className={styles.hintButton}
        type="button"
        data-testid="math-hint-button"
        onClick={() => setShowHint(true)}
      >
        {he.hintCta}
      </button>
      {showHint && (
        <p className={styles.hintText} data-testid="math-hint-text">
          {lesson.exercise.hint}
        </p>
      )}
    </div>
  )
}
