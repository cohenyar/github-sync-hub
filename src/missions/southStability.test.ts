import { describe, expect, it } from 'vitest'
import { checkQuestionAnswer } from './checkQuestionAnswer'
import { southStabilityMission } from './southStability'

describe('southStabilityMission', () => {
  it('is a Math question mission', () => {
    expect(southStabilityMission.subjectHe).toBe('מתמטיקה')
  })

  it('asks for 8 x 7 as a short-text answer', () => {
    expect(southStabilityMission.answerConfig).toEqual({ type: 'exact_text', acceptedAnswers: ['56'] })
  })

  it('accepts the correct answer case/whitespace-insensitively and rejects a wrong one', () => {
    expect(checkQuestionAnswer(southStabilityMission.answerConfig, '56')).toBe(true)
    expect(checkQuestionAnswer(southStabilityMission.answerConfig, ' 56 ')).toBe(true)
    expect(checkQuestionAnswer(southStabilityMission.answerConfig, '54')).toBe(false)
  })

  it('defines a success effect that improves stability in the South district', () => {
    expect(southStabilityMission.successEffect).toEqual({
      kind: 'ADJUST_STAT',
      districtId: 'south',
      stat: 'stability',
      delta: 30,
    })
  })
})
