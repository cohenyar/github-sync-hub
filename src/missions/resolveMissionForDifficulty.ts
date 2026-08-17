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
 * Which pool slots a mission may draw from — a rotation of positions within
 * its own subject's pool, independent of campaign order: e.g. full-signal is
 * campaign position 4 overall, but it's History's OWN second mission, so its
 * rotation lives in the odd slots (1, 3, 5), same as linked-records (English)
 * and priority-signal (Math). Each rotation's first entry is exactly the
 * original single fixed slot this mission always used, before rotation
 * existed — see resolveMissionForDifficulty's rotationSeed default below.
 */
const SLOT_ROTATION_BY_MISSION_ID: Readonly<Record<string, readonly number[]>> = {
  'first-contact': [0, 2, 4],
  'full-signal': [1, 3, 5],
  'district-ties': [0, 2, 4],
  'linked-records': [1, 3, 5],
  'south-stability': [0, 2, 4],
  'priority-signal': [1, 3, 5],
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
 *
 * rotationSeed picks which slot in the mission's rotation is shown, so a
 * player doesn't see the exact same question every time they're back at a
 * given mission+difficulty. It defaults to 0, and slots[0] for every
 * mission id is exactly the original fixed slot this function always used
 * before rotation existed — so every existing 2-argument call site (and
 * every test) is completely unaffected; only passing a third argument
 * explicitly changes behavior.
 */
export function resolveMissionForDifficulty(
  mission: MissionConfig,
  difficultyLevel: DifficultyLevel,
  rotationSeed = 0,
): MissionConfig {
  if (difficultyLevel === 1) return mission

  const pool = POOL_BY_SUBJECT[mission.subjectHe]
  const slots = SLOT_ROTATION_BY_MISSION_ID[mission.id]
  if (!pool || !slots || slots.length === 0) return mission

  const slotIndex = slots[rotationSeed % slots.length]
  const entry = pool[difficultyLevel][slotIndex] ?? pool[difficultyLevel][slots[0]]
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
