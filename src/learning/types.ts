/**
 * Subject-neutral lesson foundation (Batch 3A.4A). Deliberately independent
 * of `src/missions/types.ts` — a LessonConfig is never a MissionConfig and
 * never enters `missionRegistry`/`defaultCampaign`. Lesson ids are always
 * namespaced (`lesson:<subject>-<n>`) so `isLessonId` can tell a lesson id
 * apart from a SQL mission id without looking either registry up.
 */

export interface LessonVerdict {
  pass: boolean
}

export interface VocabularyItem {
  hebrew: string
  english: string
}

export interface MathExerciseConfig {
  correctAnswer: number
  hint: string
}

export interface EnglishExerciseConfig {
  items: readonly VocabularyItem[]
  hint: string
}

interface BaseLessonConfig {
  id: string
  title: string
  instructions: string
}

export interface MathLessonConfig extends BaseLessonConfig {
  subject: 'math'
  exercise: MathExerciseConfig
}

export interface EnglishLessonConfig extends BaseLessonConfig {
  subject: 'english'
  exercise: EnglishExerciseConfig
}

export type LessonConfig = MathLessonConfig | EnglishLessonConfig

export function isLessonId(id: string): boolean {
  return id.startsWith('lesson:')
}

export function isMathLesson(lesson: LessonConfig): lesson is MathLessonConfig {
  return lesson.subject === 'math'
}

export function isEnglishLesson(lesson: LessonConfig): lesson is EnglishLessonConfig {
  return lesson.subject === 'english'
}
