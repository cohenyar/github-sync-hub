import { useState } from 'react'
import { he } from '../../i18n'
import { isEnglishLesson, isMathLesson, type LessonConfig } from '../types'
import { EnglishExercisePanel } from './EnglishExercisePanel'
import { MathExercisePanel } from './MathExercisePanel'
import styles from './LessonStage.module.css'

export interface LessonStageProps {
  lesson: LessonConfig
  /** Whether this lesson was already completed in a previous session — reopening it shows the success state immediately instead of forcing a resubmit. */
  isCompleted: boolean
  onResult: (pass: boolean) => void
  onReturnToWorld: () => void
}

/**
 * The world-scene overlay that hosts a single active lesson. Purely a
 * presentation shell: which exercise to render is decided by the same
 * isMathLesson/isEnglishLesson type guards used everywhere else in
 * src/learning, and neither panel — nor this component — ever imports
 * anything from src/missions.
 */
export function LessonStage({ lesson, isCompleted, onResult, onReturnToWorld }: LessonStageProps) {
  const [justPassed, setJustPassed] = useState(false)

  function handleResult(pass: boolean) {
    onResult(pass)
    if (pass) setJustPassed(true)
  }

  const showSuccess = justPassed || isCompleted

  return (
    <div className={styles.overlay} role="dialog" data-testid="lesson-stage" data-lesson-id={lesson.id}>
      <div className={styles.panel}>
        <h2 className={styles.title}>{lesson.title}</h2>
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
        <button
          type="button"
          className={styles.returnButton}
          data-testid="lesson-return-to-world-button"
          onClick={onReturnToWorld}
        >
          {he.returnToWorldButton}
        </button>
      </div>
    </div>
  )
}
