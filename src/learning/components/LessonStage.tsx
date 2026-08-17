import { useState } from 'react'
import { he } from '../../i18n'
import { isEnglishLesson, isMathLesson, type LessonConfig } from '../types'
import { EnglishExercisePanel } from './EnglishExercisePanel'
import { MathExercisePanel } from './MathExercisePanel'
import styles from './LessonStage.module.css'

export interface LessonStageProps {
  lesson: LessonConfig
  onResult: (pass: boolean) => void
  onReturnToWorld: () => void
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
 */
export function LessonStage({ lesson, onResult, onReturnToWorld }: LessonStageProps) {
  const [justPassed, setJustPassed] = useState(false)

  function handleResult(pass: boolean) {
    onResult(pass)
    if (pass) setJustPassed(true)
  }

  const showSuccess = justPassed

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
            </>
          )}
          {!showSuccess && isMathLesson(lesson) && <MathExercisePanel lesson={lesson} onResult={handleResult} />}
          {!showSuccess && isEnglishLesson(lesson) && <EnglishExercisePanel lesson={lesson} onResult={handleResult} />}
        </div>
      </div>
    </div>
  )
}
