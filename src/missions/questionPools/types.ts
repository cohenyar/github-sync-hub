import type { MissionAnswerConfig } from '../../cms/types'
import type { DifficultyLevel } from '../../progression/types'

/**
 * Real difficulty differentiation pass — one subject/difficulty pool entry.
 * Deliberately just the three fields that make up "the question" (see
 * MissionConfig's own taskHe/answerConfig/hintHe): a pool entry is never a
 * full mission (no id/successEffect/campaign linkage) because it never
 * becomes one — it's resolved onto an existing, stable-id mission by
 * resolveMissionForDifficulty, never registered on its own.
 */
export interface PoolQuestion {
  /** Pool-local id, only for content-authoring/testing clarity — never a mission id and never persisted. */
  id: string
  taskHe: string
  answerConfig: MissionAnswerConfig
  /**
   * A single difficulty-appropriate hint: Level 1 entries can afford a
   * strong, explicit nudge; Level 3 entries must never reveal the answer.
   * Unlike MissionConfig's own guidanceLevel1/2/3 (one question, three
   * verbosity tiers), a pool entry only ever needs one — the tier is
   * already baked into which pool it lives in.
   */
  hintHe: string
}

export type QuestionPool = Readonly<Record<DifficultyLevel, readonly PoolQuestion[]>>
