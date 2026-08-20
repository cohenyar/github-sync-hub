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
 * Question-selection fix pass — each subject has exactly two real missions,
 * and both draw from the SAME subject pool (not a private half of it): this
 * is just each mission's own starting point within that shared pool, so two
 * missions of the same subject don't open on an identical question. 0 is
 * exactly the original fixed slot first-contact/district-ties/south-
 * stability always used before rotation existed; 1 is the same for full-
 * signal/linked-records/priority-signal — both unchanged from before this
 * pass. Next Question (see useQuestionMission's advanceToNextQuestion)
 * advances rotationSeed from there, walking every one of the pool's entries
 * (see resolveMissionForDifficulty below) before ever repeating one.
 */
const MISSION_POOL_OFFSET: Readonly<Record<string, number>> = {
  'first-contact': 0,
  'full-signal': 1,
  'district-ties': 0,
  'linked-records': 1,
  'south-stability': 0,
  'priority-signal': 1,
}

/**
 * Real difficulty differentiation pass — resolves which question a mission
 * actually shows for the player's current difficulty level. Every level,
 * including Easy, substitutes a genuinely different, level-appropriate
 * question from that subject's own difficulty pool, while every identity
 * field (id, successEffect, subjectHe, title/goal/prompt) is preserved
 * unchanged via the spread, so progression/saves/campaign order/Odin's
 * subject label are entirely unaffected by which question is currently
 * showing.
 *
 * A mission with no matching subject pool or offset (e.g. future admin- or
 * CMS-authored content) falls back to its own content rather than
 * throwing — the pool system is additive, never a hard requirement.
 *
 * rotationSeed picks which entry of the mission's own subject+difficulty
 * pool is shown, cycling through every one of that pool's entries (not just
 * a fixed subset) before deterministically wrapping back to the start — see
 * useQuestionMission's advanceToNextQuestion, which is what actually
 * advances this seed on a "Next Question" press. It defaults to 0, and
 * offset+0 for every mission id is exactly the original fixed slot this
 * function always used before rotation existed — so every existing
 * 2-argument call site (and every test) sees unchanged content at level 1
 * too now, since MISSION_POOL_OFFSET's 0/1 values were chosen to exactly
 * match pool[1]'s first two, byte-identical-to-the-original-mission slots.
 */
export function resolveMissionForDifficulty(
  mission: MissionConfig,
  difficultyLevel: DifficultyLevel,
  rotationSeed = 0,
): MissionConfig {
  const pool = POOL_BY_SUBJECT[mission.subjectHe]
  const offset = MISSION_POOL_OFFSET[mission.id]
  const levelPool = pool?.[difficultyLevel]
  if (!pool || offset === undefined || !levelPool || levelPool.length === 0) return mission

  const slotIndex = (offset + rotationSeed) % levelPool.length
  const entry = levelPool[slotIndex]
  if (!entry) return mission

  // At the mission's own original slot (rotationSeed 0, or any full lap back
  // to it), Level 1 keeps showing the mission's own hand-authored
  // guidanceLevel1 when it has one — a more specific, tailored nudge (see
  // e.g. fullSignalMission's "the answer is mentioned explicitly in the text
  // above") than the pool entry's own generic hintHe. Every other pool
  // entry (the rest of the Easy pool, reached via Next Question) has no such
  // dedicated field, so hintHe is the only hint source there.
  const isOriginalSlot = slotIndex === offset
  const level1Guidance = isOriginalSlot ? (mission.guidanceLevel1 ?? entry.hintHe) : entry.hintHe

  return {
    ...mission,
    taskHe: entry.taskHe,
    answerConfig: entry.answerConfig,
    hintHe: entry.hintHe,
    guidanceLevel1: difficultyLevel === 1 ? level1Guidance : undefined,
    guidanceLevel2: difficultyLevel === 2 ? entry.hintHe : undefined,
    guidanceLevel3: difficultyLevel === 3 ? entry.hintHe : undefined,
  }
}
