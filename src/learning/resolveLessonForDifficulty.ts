import type { DifficultyLevel } from '../progression/types'
import { englishLessonPool } from './questionPools/english'
import { mathLessonPool } from './questionPools/math'
import { isEnglishLesson, isMathLesson, type LessonConfig } from './types'

/**
 * Question-selection fix pass — the NPC-teacher lesson system's own
 * counterpart to src/missions/resolveMissionForDifficulty.ts, same
 * contract: a pure function of (lesson, difficultyLevel, rotationSeed)
 * that swaps in a genuinely different, level-appropriate exercise from
 * that subject's own pool, while every identity field (id, title) is
 * preserved unchanged via the spread — completedLessonIds/ArchivePageFound/
 * Odin's LessonCompleted reaction all key off lesson.id, which never
 * changes here.
 *
 * rotationSeed defaults to 0, and offset 0 for both subjects is exactly
 * lesson:math-001/lesson:english-001's own original content — so a fresh
 * Easy-difficulty game is byte-identical to before this pass; only a
 * non-default seed (advanced by LessonStage's own "Next Question" action)
 * reveals the rest of the pool. There is only one lesson per subject
 * today, so unlike the mission pools there is no per-lesson starting
 * offset to keep two lessons from opening on the same question.
 */
export function resolveLessonForDifficulty(
  lesson: LessonConfig,
  difficultyLevel: DifficultyLevel,
  rotationSeed = 0,
): LessonConfig {
  if (isMathLesson(lesson)) {
    const levelPool = mathLessonPool[difficultyLevel]
    const entry = levelPool[rotationSeed % levelPool.length]
    if (!entry) return lesson
    return { ...lesson, instructions: entry.instructions, exercise: entry.exercise }
  }
  if (isEnglishLesson(lesson)) {
    const levelPool = englishLessonPool[difficultyLevel]
    const entry = levelPool[rotationSeed % levelPool.length]
    if (!entry) return lesson
    return { ...lesson, instructions: entry.instructions, exercise: entry.exercise }
  }
  return lesson
}
