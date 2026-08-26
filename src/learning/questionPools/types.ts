import type { DifficultyLevel } from '../../progression/types'
import type { EnglishExerciseConfig, MathExerciseConfig } from '../types'

/**
 * Question-selection fix pass — the NPC-teacher lesson system's own
 * difficulty pool, mirroring src/missions/questionPools/types.ts's
 * PoolQuestion shape exactly (id for authoring clarity only, never
 * persisted; instructions/exercise are the resolved lesson content). Two
 * separate pool shapes since MathExerciseConfig and EnglishExerciseConfig
 * are structurally different (a single number vs. a word-translation list).
 */
export interface MathPoolQuestion {
  id: string
  instructions: string
  exercise: MathExerciseConfig
}

export interface EnglishPoolQuestion {
  id: string
  instructions: string
  exercise: EnglishExerciseConfig
}

export type MathQuestionPool = Readonly<Record<DifficultyLevel, readonly MathPoolQuestion[]>>
export type EnglishQuestionPool = Readonly<Record<DifficultyLevel, readonly EnglishPoolQuestion[]>>
