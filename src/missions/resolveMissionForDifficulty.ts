import type { DifficultyLevel } from '../progression/types'
import { englishPool } from './questionPools/english'
import { historyPool } from './questionPools/history'
import { mathPool } from './questionPools/math'
import type { QuestionPool } from './questionPools/types'
import type { MissionConfig } from './types'

const POOL_BY_SUBJECT: Readonly<Record<string, QuestionPool>> = {
  היסטוריה: historyPool,
  אנגלית: englishPool,
  מתמטיקה: mathPool,
}

/**
 * Which pool slot a mission draws from — its position (0 or 1) within its
 * own subject's two-mission sequence. Independent of campaign order: e.g.
 * full-signal is campaign position 4 overall, but it's History's OWN
 * second mission, so it takes slot 1 of the History pool, same as
 * linked-records (English) and priority-signal (Math).
 */
const SLOT_INDEX_BY_MISSION_ID: Readonly<Record<string, number>> = {
  'first-contact': 0,
  'full-signal': 1,
  'district-ties': 0,
  'linked-records': 1,
  'south-stability': 0,
  'priority-signal': 1,
}

/**
 * Real difficulty differentiation pass — resolves which question a mission
 * actually shows for the player's current difficulty level. Level 1 always
 * returns the mission's own authored fields completely unchanged (same
 * object reference, even) — a fresh Easy-difficulty game is byte-identical
 * to before this pass existed. Levels 2 and 3 substitute a genuinely
 * different, level-appropriate question from that subject's pool, while
 * every identity field (id, successEffect, subjectHe, title/goal/prompt)
 * is preserved unchanged via the spread, so progression/saves/campaign
 * order/Odin's subject label are entirely unaffected by which question is
 * currently showing.
 *
 * A mission with no matching subject pool or slot (e.g. future admin- or
 * CMS-authored content) falls back to its own content rather than
 * throwing — the pool system is additive, never a hard requirement.
 */
export function resolveMissionForDifficulty(mission: MissionConfig, difficultyLevel: DifficultyLevel): MissionConfig {
  if (difficultyLevel === 1) return mission

  const pool = POOL_BY_SUBJECT[mission.subjectHe]
  const slotIndex = SLOT_INDEX_BY_MISSION_ID[mission.id]
  if (!pool || slotIndex === undefined) return mission

  const entry = pool[difficultyLevel][slotIndex] ?? pool[difficultyLevel][0]
  if (!entry) return mission

  return {
    ...mission,
    taskHe: entry.taskHe,
    answerConfig: entry.answerConfig,
    hintHe: entry.hintHe,
    guidanceLevel1: undefined,
    guidanceLevel2: difficultyLevel === 2 ? entry.hintHe : undefined,
    guidanceLevel3: difficultyLevel === 3 ? entry.hintHe : undefined,
  }
}
