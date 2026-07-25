import { useState, type FormEvent } from 'react'
import { he } from '../../i18n'
import { checkEnglishAnswer } from '../verifiers/englishVerifier'
import type { EnglishLessonConfig } from '../types'
import styles from './ExercisePanel.module.css'

export interface EnglishExercisePanelProps {
  lesson: EnglishLessonConfig
  onResult?: (pass: boolean) => void
}

/**
 * Pure, standalone exercise UI — no dependency on missions, useMissionManager,
 * or runQuery. Verification is local and deterministic (see englishVerifier.ts).
 */
export function EnglishExercisePanel({ lesson, onResult }: EnglishExercisePanelProps) {
  const [answers, setAnswers] = useState<string[]>(() => lesson.exercise.items.map(() => ''))
  const [verdict, setVerdict] = useState<'pass' | 'fail' | null>(null)
  const [showHint, setShowHint] = useState(false)

  function handleAnswerChange(index: number, value: string) {
    setAnswers((current) => current.map((existing, i) => (i === index ? value : existing)))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const result = checkEnglishAnswer(lesson.exercise, answers)
    setVerdict(result.pass ? 'pass' : 'fail')
    onResult?.(result.pass)
  }

  return (
    <div className={styles.panel} data-testid="english-exercise-panel">
      <p className={styles.instructions}>{lesson.instructions}</p>
      <form className={styles.form} onSubmit={handleSubmit}>
        {lesson.exercise.items.map((item, index) => (
          <label className={styles.item} key={item.hebrew}>
            <span className={styles.itemLabel}>{item.hebrew}</span>
            <input
              className={styles.input}
              type="text"
              value={answers[index]}
              onChange={(event) => handleAnswerChange(index, event.target.value)}
              aria-label={`${he.englishAnswerLabel}: ${item.hebrew}`}
              data-testid={`english-answer-input-${index}`}
            />
          </label>
        ))}
        <button className={styles.submitButton} type="submit" data-testid="english-submit-button">
          {he.submitAnswerCta}
        </button>
      </form>
      {verdict === 'pass' && (
        <p className={styles.feedbackPass} data-testid="english-exercise-feedback">
          {he.exerciseCorrectFeedback}
        </p>
      )}
      {verdict === 'fail' && (
        <p className={styles.feedbackFail} data-testid="english-exercise-feedback">
          {he.exerciseIncorrectFeedback}
        </p>
      )}
      <button
        className={styles.hintButton}
        type="button"
        data-testid="english-hint-button"
        onClick={() => setShowHint(true)}
      >
        {he.hintCta}
      </button>
      {showHint && (
        <p className={styles.hintText} data-testid="english-hint-text">
          {lesson.exercise.hint}
        </p>
      )}
    </div>
  )
}
