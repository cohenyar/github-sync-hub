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

describe('resolveMissionForDifficulty — Level 1 draws from its own real pool too', () => {
  // Question-selection fix pass: Level 1 used to be a strict no-op (always
  // the base mission's own hardcoded content, never touching the pool),
  // which meant Easy's other 4 pool entries per subject were permanently
  // unreachable. It now resolves from pool[1] exactly like levels 2/3 — at
  // the default rotationSeed=0 this is still byte-identical content to
  // before (see the "first two pool slots" test below), so a fresh game's
  // very first question at Easy is unchanged; only a non-default seed
  // reveals the rest of the pool.
  it('at the default rotationSeed=0, every real mission shows the exact same taskHe/answerConfig as its own original content', () => {
    for (const mission of ALL_BASE_MISSIONS) {
      const resolved = resolveMissionForDifficulty(mission, 1)
      expect(resolved.taskHe).toBe(mission.taskHe)
      expect(resolved.answerConfig).toEqual(mission.answerConfig)
    }
  })

  it('a non-zero rotationSeed resolves a genuinely different Level 1 question from the same subject pool', () => {
    for (const mission of ALL_BASE_MISSIONS) {
      const seed0 = resolveMissionForDifficulty(mission, 1, 0)
      const seed1 = resolveMissionForDifficulty(mission, 1, 1)
      expect(seed1.taskHe, mission.id).not.toBe(seed0.taskHe)
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

describe('resolveMissionForDifficulty — rotationSeed cycles through the whole subject pool', () => {
  it('omitting rotationSeed produces the exact same result as passing rotationSeed=0 explicitly, at every difficulty level', () => {
    for (const mission of ALL_BASE_MISSIONS) {
      for (const level of [1, 2, 3] as const) {
        expect(resolveMissionForDifficulty(mission, level)).toEqual(resolveMissionForDifficulty(mission, level, 0))
      }
    }
  })

  it('a different rotationSeed produces a genuinely different taskHe at every difficulty level, for every real mission', () => {
    for (const mission of ALL_BASE_MISSIONS) {
      for (const level of [1, 2, 3] as const) {
        const seed0 = resolveMissionForDifficulty(mission, level, 0)
        const seed1 = resolveMissionForDifficulty(mission, level, 1)
        expect(seed1.taskHe, `${mission.id} level ${level}`).not.toBe(seed0.taskHe)
      }
    }
  })

  it("the mission's own id field is unchanged regardless of rotationSeed, at every difficulty level", () => {
    for (const mission of ALL_BASE_MISSIONS) {
      for (const level of [1, 2, 3] as const) {
        for (const seed of [0, 1, 2, 5, 99]) {
          expect(resolveMissionForDifficulty(mission, level, seed).id).toBe(mission.id)
        }
      }
    }
  })

  it('6 consecutive seeds visit 6 genuinely distinct questions before the 7th deterministically repeats the 1st (no immediate repetition until the pool is exhausted)', () => {
    for (const mission of ALL_BASE_MISSIONS) {
      for (const level of [1, 2, 3] as const) {
        const seen = Array.from({ length: 6 }, (_, seed) => resolveMissionForDifficulty(mission, level, seed).taskHe)
        expect(new Set(seen).size, `${mission.id} level ${level}`).toBe(6)
        const wrapped = resolveMissionForDifficulty(mission, level, 6).taskHe
        expect(wrapped, `${mission.id} level ${level}`).toBe(seen[0])
      }
    }
  })

  it("two missions sharing a subject start at different pool slots, so they don't open on an identical question", () => {
    const SAME_SUBJECT_PAIRS = [
      [firstContactMission, fullSignalMission],
      [districtTiesMission, linkedRecordsMission],
      [southStabilityMission, prioritySignalMission],
    ] as const
    for (const [missionA, missionB] of SAME_SUBJECT_PAIRS) {
      for (const level of [1, 2, 3] as const) {
        const a = resolveMissionForDifficulty(missionA, level, 0)
        const b = resolveMissionForDifficulty(missionB, level, 0)
        expect(a.taskHe, `${missionA.id} vs ${missionB.id} level ${level}`).not.toBe(b.taskHe)
      }
    }
  })
})

describe('resolveMissionForDifficulty — hint wiring', () => {
  it("Level 1 at the mission's own original slot prefers its hand-authored guidanceLevel1 over the pool entry's generic hintHe, when the mission has one", () => {
    // firstContactMission.guidanceLevel1 ("the answer is mentioned
    // explicitly in the text above") is a more specific, tailored nudge
    // than its own hintHe ("he was Julius Caesar's adopted nephew") — Ask
    // Odin's hint action and QuestionAnswerPanel's inline hint both depend
    // on this exact preference (see e2e/playtest-fixes.spec.ts's Ask Odin
    // coverage).
    const resolved = resolveMissionForDifficulty(firstContactMission, 1)
    expect(resolved.guidanceLevel1).toBe(firstContactMission.guidanceLevel1)
    expect(resolved.guidanceLevel1).not.toBe(resolved.hintHe)
    expect(resolved.guidanceLevel2).toBeUndefined()
    expect(resolved.guidanceLevel3).toBeUndefined()
  })

  it('Level 1 at any other pool slot uses that entry\'s own hintHe — there is no mission-specific guidanceLevel1 for a question the mission never originally had', () => {
    // rotationSeed=2 lands on history-l1-c ("which ancient empire built the
    // Colosseum"), a pool-only entry with no originating mission at all.
    const resolved = resolveMissionForDifficulty(firstContactMission, 1, 2)
    expect(resolved.taskHe).not.toBe(firstContactMission.taskHe)
    expect(resolved.guidanceLevel1).toBeDefined()
    expect(resolved.guidanceLevel1).toBe(resolved.hintHe)
    expect(resolved.guidanceLevel2).toBeUndefined()
    expect(resolved.guidanceLevel3).toBeUndefined()
  })

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

describe('question pools — expanded totals (6+ per level, 18+ per subject, 54+ grand total)', () => {
  it('each subject has at least 6 questions at every one of the 3 difficulty levels', () => {
    for (const [subject, pool] of Object.entries(POOLS)) {
      for (const level of [1, 2, 3] as const) {
        expect(pool[level].length, `${subject} level ${level}`).toBeGreaterThanOrEqual(6)
      }
    }
  })

  it('each subject has at least 18 questions total across its 3 levels combined', () => {
    for (const [subject, pool] of Object.entries(POOLS)) {
      const total = ([1, 2, 3] as const).reduce((sum, level) => sum + pool[level].length, 0)
      expect(total, subject).toBeGreaterThanOrEqual(18)
    }
  })

  it('the grand total across every subject and level combined is at least 54', () => {
    let grandTotal = 0
    for (const pool of Object.values(POOLS)) {
      for (const level of [1, 2, 3] as const) grandTotal += pool[level].length
    }
    expect(grandTotal).toBeGreaterThanOrEqual(54)
  })
})

describe('question pools — level differentiation (no verbatim question text reused across difficulty levels)', () => {
  it('the set of taskHe texts in one level is disjoint from every other level, within the same subject pool', () => {
    for (const [subject, pool] of Object.entries(POOLS)) {
      const byLevel = {
        1: new Set(pool[1].map((q) => q.taskHe)),
        2: new Set(pool[2].map((q) => q.taskHe)),
        3: new Set(pool[3].map((q) => q.taskHe)),
      }
      for (const text of byLevel[2]) {
        expect(byLevel[1].has(text), `${subject}: "${text}" reused from level 1 in level 2`).toBe(false)
      }
      for (const text of byLevel[3]) {
        expect(byLevel[1].has(text), `${subject}: "${text}" reused from level 1 in level 3`).toBe(false)
      }
      for (const text of byLevel[3]) {
        expect(byLevel[2].has(text), `${subject}: "${text}" reused from level 2 in level 3`).toBe(false)
      }
    }
  })
})
