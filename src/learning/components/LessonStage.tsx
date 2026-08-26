import { useState } from 'react'
import { he } from '../../i18n'
import type { DifficultyLevel } from '../../progression/types'
import { resolveLessonForDifficulty } from '../resolveLessonForDifficulty'
import { isEnglishLesson, isMathLesson, type LessonConfig } from '../types'
import { EnglishExercisePanel } from './EnglishExercisePanel'
import { MathExercisePanel } from './MathExercisePanel'
import styles from './LessonStage.module.css'

export interface LessonStageProps {
  lesson: LessonConfig
  onResult: (pass: boolean) => void
  onReturnToWorld: () => void
  /**
   * Question-selection fix pass — optional so every existing caller/test
   * that omits it keeps the exact original one-question behavior (no pool,
   * no Next Question button, a fresh pass permanently shows the success
   * screen). When provided, the lesson's own subject+difficulty pool (see
   * ../questionPools/{math,english}.ts) drives which exercise shows, and a
   * "Next Question" action appears after passing.
   */
  difficultyLevel?: DifficultyLevel
}

/**
 * The world-scene overlay that hosts a single active lesson. Purely a
 * presentation shell: which exercise to render is decided by the same
 * isMathLesson/isEnglishLesson type guards used everywhere else in
 * src/learning, and neither panel — nor this component — ever imports
 * anything from src/missions.
 *
 * Bug-fix pass: every entry point into a lesson (GameApp's handleStartLesson)
 * is the same "Start Lesson"/"תרגל שוב" button regardless of prior
 * completion, and a fresh mount always starts here. Persisted completion
 * (completedLessonIds) intentionally has no say over what this component
 * shows — a replay must behave exactly like the first attempt, so success
 * is shown only once the player actually passes again in this session.
 *
 * Question-selection fix pass — this used to be the ONE learning system with
 * no difficulty/pool concept at all (see resolveLessonForDifficulty.ts's own
 * doc comment); it's now brought up to the same subject/difficulty/Next-
 * Question contract the Terminal mission system already has
 * (QuestionAnswerPanel), reusing the identical edge-trigger completion guard
 * (onResult(true) fires only on the session's first-ever pass, mirroring
 * useQuestionMission's wasCompleted/nextCompleted pattern) so answering
 * extra practice questions can never fire a second completion event. The
 * question-slot seed lives entirely inside this component (not lifted to
 * GameApp) since there is only one lesson per subject and GameApp always
 * fully unmounts/remounts this component between lessons (activeLessonId
 * cycles null -> id -> null -> id, never id -> a different id directly).
 */
export function LessonStage({ lesson, onResult, onReturnToWorld, difficultyLevel }: LessonStageProps) {
  const [questionSlotSeed, setQuestionSlotSeed] = useState(0)
  const [sessionCompleted, setSessionCompleted] = useState(false)
  // Distinct from sessionCompleted: this is "did the CURRENTLY shown
  // question just pass," reset by Next Question so a fresh question never
  // shows a stale success screen — sessionCompleted, once true, never
  // resets within this mount (mission/lesson completion is permanent for
  // the session), exactly mirroring useQuestionMission's own
  // completed/lastResult split.
  const [lastPass, setLastPass] = useState<boolean | null>(null)

  const resolvedLesson = difficultyLevel === undefined ? lesson : resolveLessonForDifficulty(lesson, difficultyLevel, questionSlotSeed)

  function handleResult(pass: boolean) {
    setLastPass(pass)
    if (pass) {
      const wasCompleted = sessionCompleted
      setSessionCompleted(true)
      if (!wasCompleted) onResult(true)
    } else {
      onResult(false)
    }
  }

  function handleNextQuestion() {
    setQuestionSlotSeed((seed) => seed + 1)
    setLastPass(null)
  }

  const showSuccess = lastPass === true
  // Next Question only ever offered when a real pool is available — an
  // omitted difficultyLevel (every existing test/caller) never renders it,
  // so the success screen stays exactly as permanent as it always was.
  const canShowNextQuestion = difficultyLevel !== undefined

  return (
    <div className={styles.overlay} role="dialog" data-testid="lesson-stage" data-lesson-id={lesson.id}>
      <div className={styles.panel}>
        {/* Header is a fixed toolbar — it never scrolls. The return button
            lives here (not after the exercise content) so it's reachable
            immediately, even on a short viewport with a long lesson (e.g.
            English's 5 vocabulary inputs vs Math's 1). See LessonStage
            bug-fix pass: "unreachable return button" investigation. */}
        <div className={styles.header}>
          <h2 className={styles.title}>{lesson.title}</h2>
          <button
            type="button"
            className={styles.returnButton}
            data-testid="lesson-return-to-world-button"
            onClick={onReturnToWorld}
          >
            {he.returnToWorldButton}
          </button>
        </div>
        <div className={styles.body}>
          {showSuccess && (
            <>
              <p className={styles.successMessage} data-testid="lesson-success-message">
                {he.lessonSuccessMessage}
              </p>
              {/* A generic what's-next hint, deliberately distinct from
                  Odin's own (more specific) success reaction shown separately
                  via OdinPresence — see defaultOdinReactions.ts's
                  lesson-math-completed/lesson-english-completed. */}
              <p className={styles.nextStepsMessage} data-testid="lesson-success-next-steps">
                {he.lessonSuccessNextStepsMessage}
              </p>
              {canShowNextQuestion && (
                <button
                  type="button"
                  className={styles.nextQuestionButton}
                  data-testid="lesson-next-question-button"
                  onClick={handleNextQuestion}
                >
                  {he.nextQuestionCta}
                </button>
              )}
            </>
          )}
          {/* Keyed on both the current pool slot AND difficultyLevel — either
              one changing means genuinely different resolved content (same
              lesson id), so either must force a fresh exercise-panel mount,
              resetting its own local answer/verdict/hint state without
              either panel needing a reset effect of its own. Difficulty is
              included even though switching it while this stays mounted
              isn't reachable through today's UI (Settings lives behind the
              lesson overlay) — this is what the "difficulty change must
              clear previous answer/feedback" contract actually requires if
              that ever changes, and it costs nothing today. */}
          {!showSuccess && isMathLesson(resolvedLesson) && (
            <MathExercisePanel key={`${difficultyLevel}-${questionSlotSeed}`} lesson={resolvedLesson} onResult={handleResult} />
          )}
          {!showSuccess && isEnglishLesson(resolvedLesson) && (
            <EnglishExercisePanel key={`${difficultyLevel}-${questionSlotSeed}`} lesson={resolvedLesson} onResult={handleResult} />
          )}
        </div>
      </div>
    </div>
  )
}
