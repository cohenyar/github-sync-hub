import { describe, expect, it } from 'vitest'
import { checkQuestionAnswer, getMissionDisplayText, missionRegistry, type MissionConfig } from '../../missions'
import { resolveAskOdinAnswer, type AskOdinQuestionId } from './resolveAskOdinAnswer'

const SQL_TERMS = /\bSQL\b|\bSELECT\b|\bFROM\b|\bquery\b|\bcitizens\b|database table|SQL editor|SQL result/i

function contextFor(mission: MissionConfig, overrides: Partial<Parameters<typeof resolveAskOdinAnswer>[1]> = {}) {
  const display = getMissionDisplayText(mission)
  return {
    subjectHe: mission.subjectHe,
    missionGoal: display.goal,
    missionPrompt: display.prompt,
    missionHint: display.hint,
    guidanceLevel1: mission.guidanceLevel1,
    guidanceLevel2: mission.guidanceLevel2,
    guidanceLevel3: mission.guidanceLevel3,
    destinationName: 'מוקד הרשומות',
    lastResult: null,
    ...overrides,
  }
}

const ALL_QUESTION_IDS: readonly AskOdinQuestionId[] = [
  'what-now',
  'subject',
  'explain-question',
  'hint',
  'why-wrong',
  'where-to-go',
]

describe('resolveAskOdinAnswer — every real campaign mission (History/English/Math)', () => {
  it('reports the correct subject for every real mission', () => {
    const subjectsById = Object.fromEntries(missionRegistry.map((mission) => [mission.id, mission.subjectHe]))
    expect(subjectsById['first-contact']).toBe('היסטוריה')
    expect(subjectsById['district-ties']).toBe('אנגלית')
    expect(subjectsById['south-stability']).toBe('מתמטיקה')
    expect(subjectsById['full-signal']).toBe('היסטוריה')
    expect(subjectsById['linked-records']).toBe('אנגלית')
    expect(subjectsById['priority-signal']).toBe('מתמטיקה')

    for (const mission of missionRegistry) {
      expect(resolveAskOdinAnswer('subject', contextFor(mission))).toContain(mission.subjectHe)
    }
  })

  it('never mentions SQL-learning terms in any answer, for any real mission, at any difficulty level', () => {
    for (const mission of missionRegistry) {
      for (const difficultyLevel of [undefined, 1, 2, 3] as const) {
        for (const questionId of ALL_QUESTION_IDS) {
          const answer = resolveAskOdinAnswer(
            questionId,
            contextFor(mission, {
              difficultyLevel,
              lastResult: { pass: false, submittedAnswer: 'wrong' },
            }),
          )
          expect(answer).not.toMatch(SQL_TERMS)
        }
      }
    }
  })

  it('never reveals the correct answer through "hint" or "why-wrong" at Hard difficulty, for any real mission', () => {
    for (const mission of missionRegistry) {
      const correctAnswerText =
        mission.answerConfig.type === 'multiple_choice'
          ? mission.answerConfig.options[mission.answerConfig.correctIndex]
          : mission.answerConfig.acceptedAnswers[0]

      const context = contextFor(mission, {
        difficultyLevel: 3,
        lastResult: { pass: false, submittedAnswer: 'wrong' },
      })
      expect(resolveAskOdinAnswer('hint', context)).not.toContain(correctAnswerText)
      expect(resolveAskOdinAnswer('why-wrong', context)).not.toContain(correctAnswerText)
    }
  })

  it('the factual correct answer never changes by difficulty level — only the guidance around it does', () => {
    // checkQuestionAnswer (the actual source of truth for pass/fail) takes
    // no difficulty parameter at all, so the correct answer is structurally
    // identical regardless of the player's chosen level.
    for (const mission of missionRegistry) {
      const correctSubmission =
        mission.answerConfig.type === 'multiple_choice'
          ? String(mission.answerConfig.correctIndex)
          : mission.answerConfig.acceptedAnswers[0]
      expect(checkQuestionAnswer(mission.answerConfig, correctSubmission)).toBe(true)
    }
  })
})
