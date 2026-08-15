import { describe, expect, it } from 'vitest'
import { checkQuestionAnswer } from './checkQuestionAnswer'
import { districtTiesMission } from './districtTies'
import { firstContactMission } from './firstContact'
import { fullSignalMission } from './fullSignal'
import { linkedRecordsMission } from './linkedRecords'
import { prioritySignalMission } from './prioritySignal'
import { englishPool } from './questionPools/english'
import { historyPool } from './questionPools/history'
import { mathPool } from './questionPools/math'
import type { QuestionPool } from './questionPools/types'
import { resolveMissionForDifficulty } from './resolveMissionForDifficulty'
import { southStabilityMission } from './southStability'
import type { MissionConfig } from './types'

const ALL_BASE_MISSIONS = [
  firstContactMission,
  districtTiesMission,
  southStabilityMission,
  fullSignalMission,
  linkedRecordsMission,
  prioritySignalMission,
]

const POOLS: Record<string, QuestionPool> = { history: historyPool, english: englishPool, math: mathPool }

describe('resolveMissionForDifficulty — Level 1 is a strict no-op', () => {
  it('returns the exact same object reference for every real mission at level 1', () => {
    for (const mission of ALL_BASE_MISSIONS) {
      expect(resolveMissionForDifficulty(mission, 1)).toBe(mission)
    }
  })
})

describe('resolveMissionForDifficulty — Levels 2 and 3 show genuinely different content', () => {
  it('never shows the same question text across levels 1, 2, and 3 for the same mission', () => {
    for (const mission of ALL_BASE_MISSIONS) {
      const l1 = resolveMissionForDifficulty(mission, 1).taskHe
      const l2 = resolveMissionForDifficulty(mission, 2).taskHe
      const l3 = resolveMissionForDifficulty(mission, 3).taskHe
      expect(new Set([l1, l2, l3]).size).toBe(3)
    }
  })

  it('preserves identity fields (id, subjectHe, successEffect, narrative) unchanged at every level', () => {
    for (const mission of ALL_BASE_MISSIONS) {
      for (const level of [1, 2, 3] as const) {
        const resolved = resolveMissionForDifficulty(mission, level)
        expect(resolved.id).toBe(mission.id)
        expect(resolved.subjectHe).toBe(mission.subjectHe)
        expect(resolved.successEffect).toEqual(mission.successEffect)
        expect(resolved.titleHe).toBe(mission.titleHe)
        expect(resolved.goalHe).toBe(mission.goalHe)
        expect(resolved.promptHe).toBe(mission.promptHe)
      }
    }
  })

  it("a mission's own submitted answer is checked against whatever question is currently resolved, not the base one", () => {
    // south-stability at level 1 is "8 × 7" (56); confirm level 2/3 have a
    // different correct answer, proving the check runs against the
    // resolved content, not stale base content.
    const l2 = resolveMissionForDifficulty(southStabilityMission, 2)
    const l3 = resolveMissionForDifficulty(southStabilityMission, 3)
    expect(checkQuestionAnswer(southStabilityMission.answerConfig, '56')).toBe(true)
    expect(checkQuestionAnswer(l2.answerConfig, '56')).toBe(false)
    expect(checkQuestionAnswer(l3.answerConfig, '56')).toBe(false)
  })
})

describe('resolveMissionForDifficulty — hint wiring', () => {
  it('Level 2 exposes its pool hint via guidanceLevel2 (and hintHe), matching what QuestionAnswerPanel/Ask Odin read', () => {
    const resolved = resolveMissionForDifficulty(firstContactMission, 2)
    expect(resolved.guidanceLevel2).toBeDefined()
    expect(resolved.guidanceLevel2).toBe(resolved.hintHe)
    expect(resolved.guidanceLevel1).toBeUndefined()
    expect(resolved.guidanceLevel3).toBeUndefined()
  })

  it('Level 3 exposes its pool hint via guidanceLevel3 only, and it never contains the correct answer', () => {
    const resolved = resolveMissionForDifficulty(firstContactMission, 3)
    expect(resolved.guidanceLevel3).toBeDefined()
    expect(resolved.guidanceLevel3).toBe(resolved.hintHe)
    expect(resolved.guidanceLevel1).toBeUndefined()
    expect(resolved.guidanceLevel2).toBeUndefined()
  })
})

describe('question pools — real difficulty differentiation pass', () => {
  it('every subject has at least 4 questions at every one of the 3 difficulty levels (36+ total)', () => {
    let total = 0
    for (const [subject, pool] of Object.entries(POOLS)) {
      for (const level of [1, 2, 3] as const) {
        expect(pool[level].length, `${subject} level ${level}`).toBeGreaterThanOrEqual(4)
        total += pool[level].length
      }
    }
    expect(total).toBeGreaterThanOrEqual(36)
  })

  it('every pool question id is unique within its own pool', () => {
    for (const [subject, pool] of Object.entries(POOLS)) {
      const ids = ([1, 2, 3] as const).flatMap((level) => pool[level].map((q) => q.id))
      expect(ids.length, subject).toBe(new Set(ids).size)
    }
  })

  it('every pool question is internally answerable: its own answerConfig accepts a correct submission and rejects an obviously wrong one', () => {
    for (const pool of Object.values(POOLS)) {
      for (const level of [1, 2, 3] as const) {
        for (const question of pool[level]) {
          if (question.answerConfig.type === 'multiple_choice') {
            const correctIndex = question.answerConfig.correctIndex
            expect(checkQuestionAnswer(question.answerConfig, String(correctIndex)), question.id).toBe(true)
            const wrongIndex = correctIndex === 0 ? 1 : 0
            expect(checkQuestionAnswer(question.answerConfig, String(wrongIndex)), question.id).toBe(false)
          } else {
            for (const accepted of question.answerConfig.acceptedAnswers) {
              expect(checkQuestionAnswer(question.answerConfig, accepted), question.id).toBe(true)
            }
            expect(checkQuestionAnswer(question.answerConfig, 'תשובה שגויה לחלוטין'), question.id).toBe(false)
          }
        }
      }
    }
  })

  it('Level 3 hints never spell out the correct answer text', () => {
    for (const pool of Object.values(POOLS)) {
      for (const question of pool[3]) {
        const correctAnswers =
          question.answerConfig.type === 'multiple_choice'
            ? [question.answerConfig.options[question.answerConfig.correctIndex]]
            : question.answerConfig.acceptedAnswers
        for (const answer of correctAnswers) {
          expect(question.hintHe.toLowerCase(), question.id).not.toContain(answer.toLowerCase())
        }
      }
    }
  })

  it('Level 1\'s first two pool slots per subject are exactly the existing, unchanged mission content (byte-identical to before this pass)', () => {
    const cases: Array<[keyof typeof POOLS, MissionConfig, MissionConfig]> = [
      ['history', firstContactMission, fullSignalMission],
      ['english', districtTiesMission, linkedRecordsMission],
      ['math', southStabilityMission, prioritySignalMission],
    ]
    for (const [subject, slotA, slotB] of cases) {
      expect(POOLS[subject][1][0].taskHe).toBe(slotA.taskHe)
      expect(POOLS[subject][1][0].answerConfig).toEqual(slotA.answerConfig)
      expect(POOLS[subject][1][1].taskHe).toBe(slotB.taskHe)
      expect(POOLS[subject][1][1].answerConfig).toEqual(slotB.answerConfig)
    }
  })
})
