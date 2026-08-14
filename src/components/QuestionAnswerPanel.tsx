import { useEffect, useState } from 'react'
import { he } from '../i18n'
import type { MissionConfig } from '../missions/types'
import type { QuestionMissionStatus } from '../missions/useQuestionMission'
import type { DifficultyLevel } from '../progression/types'
import styles from './QuestionAnswerPanel.module.css'

export interface QuestionAnswerPanelProps {
  mission: MissionConfig
  status: QuestionMissionStatus
  onSubmit: (answer: string) => void
  /**
   * SQL-removal pass — same three-level contract as SqlEditorPanel/
   * VerdictBanner: Easy (1) shows the mission's own hint inline, unprompted;
   * Medium (2, and the default when omitted) makes it available via a
   * button; Hard (3) shows no hint at all. The correct answer itself is
   * never revealed at any level — only checkQuestionAnswer's pass/fail.
   */
  difficultyLevel?: DifficultyLevel
}

/**
 * Purely presentational, the question-mission counterpart to SqlEditorPanel
 * — this owns only the in-progress answer (selected option / typed text)
 * and renders whatever status useQuestionMission gives it. MVP supports
 * exactly two question shapes: multiple choice and short text.
 */
export function QuestionAnswerPanel({ mission, status, onSubmit, difficultyLevel }: QuestionAnswerPanelProps) {
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [showHint, setShowHint] = useState(false)

  // A fresh question starts with a blank slate — otherwise a stale selection
  // from the previous mission could linger (or, for multiple choice, point
  // at an option index that doesn't exist in the new question).
  useEffect(() => {
    setSelectedIndex(null)
    setAnswerText('')
    setShowHint(false)
  }, [mission.id])

  const isMultipleChoice = mission.answerConfig.type === 'multiple_choice'
  const canSubmit = isMultipleChoice ? selectedIndex !== null : answerText.trim().length > 0

  function handleSubmit() {
    if (!canSubmit) return
    onSubmit(isMultipleChoice ? selectedIndex ?? '' : answerText)
  }

  const inlineHintText = difficultyLevel === 1 ? mission.guidanceLevel1 ?? mission.hintHe : undefined
  const onRequestHintText = mission.guidanceLevel2 ?? mission.hintHe
  const canRequestHint = difficultyLevel !== 1 && difficultyLevel !== 3 && Boolean(onRequestHintText)

  const lastResult = status.lastResult
  const feedbackText = !lastResult
    ? null
    : lastResult.pass
      ? he.exerciseCorrectFeedback
      : difficultyLevel === 1
        ? he.questionIncorrectFeedbackSupportive
        : difficultyLevel === 3
          ? he.questionIncorrectFeedbackMinimal
          : he.exerciseIncorrectFeedback

  return (
    <section className={styles.panel} aria-label={he.questionCardTitle} data-testid="question-panel">
      <h2 className={styles.title}>{he.questionCardTitle}</h2>
      <p className={styles.task} data-testid="question-task">
        {mission.taskHe}
      </p>

      {inlineHintText && (
        <p className={styles.inlineHint} data-testid="question-inline-hint">
          {inlineHintText}
        </p>
      )}

      {mission.answerConfig.type === 'multiple_choice' ? (
        <fieldset className={styles.options} aria-label={mission.taskHe} data-testid="question-options">
          {mission.answerConfig.options.map((option, index) => (
            <label key={index} className={styles.option} data-testid={`question-option-${index}`}>
              <input
                type="radio"
                name={`question-answer-${mission.id}`}
                value={String(index)}
                checked={selectedIndex === String(index)}
                onChange={() => setSelectedIndex(String(index))}
              />
              <span>{option}</span>
            </label>
          ))}
        </fieldset>
      ) : (
        <input
          className={styles.textInput}
          type="text"
          value={answerText}
          onChange={(event) => setAnswerText(event.target.value)}
          placeholder={he.questionAnswerInputPlaceholder}
          aria-label={he.questionAnswerInputLabel}
          data-testid="question-answer-input"
        />
      )}

      <button
        type="button"
        className={styles.submitButton}
        data-testid="question-submit-button"
        onClick={handleSubmit}
        disabled={!canSubmit}
      >
        {he.checkAnswerCta}
      </button>

      {feedbackText && (
        <p
          className={lastResult?.pass ? styles.feedbackPass : styles.feedbackFail}
          data-testid="question-feedback"
          data-verdict={lastResult?.pass ? 'pass' : 'fail'}
          role="status"
        >
          {feedbackText}
        </p>
      )}

      {canRequestHint && !showHint && (
        <button
          type="button"
          className={styles.hintButton}
          data-testid="question-hint-button"
          onClick={() => setShowHint(true)}
        >
          {he.hintCta}
        </button>
      )}
      {showHint && onRequestHintText && (
        <p className={styles.hintText} data-testid="question-hint-text">
          {onRequestHintText}
        </p>
      )}
    </section>
  )
}
