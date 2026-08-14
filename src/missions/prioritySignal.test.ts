import { describe, expect, it } from 'vitest'
import { checkQuestionAnswer } from './checkQuestionAnswer'
import { prioritySignalMission } from './prioritySignal'

describe('prioritySignalMission', () => {
  it('is a Math question mission', () => {
    expect(prioritySignalMission.subjectHe).toBe('מתמטיקה')
  })

  it('asks for 12 x 5 as multiple choice', () => {
    expect(prioritySignalMission.answerConfig).toEqual({
      type: 'multiple_choice',
      options: ['60', '50', '55', '65'],
      correctIndex: 0,
    })
  })

  it('accepts the correct option and rejects distractors', () => {
    expect(checkQuestionAnswer(prioritySignalMission.answerConfig, '0')).toBe(true)
    expect(checkQuestionAnswer(prioritySignalMission.answerConfig, '1')).toBe(false)
  })

  it('defines a success effect that improves stability in the South district', () => {
    expect(prioritySignalMission.successEffect).toEqual({
      kind: 'ADJUST_STAT',
      districtId: 'south',
      stat: 'stability',
      delta: 20,
    })
  })
})
