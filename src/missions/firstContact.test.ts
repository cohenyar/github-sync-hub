import { describe, expect, it } from 'vitest'
import { checkQuestionAnswer } from './checkQuestionAnswer'
import { firstContactMission } from './firstContact'

describe('firstContactMission', () => {
  it('is a History question mission', () => {
    expect(firstContactMission.subjectHe).toBe('היסטוריה')
  })

  it('asks about the first Roman emperor as multiple choice', () => {
    expect(firstContactMission.taskHe).toContain('הקיסר הראשון')
    expect(firstContactMission.answerConfig).toEqual({
      type: 'multiple_choice',
      options: ['אוגוסטוס', 'נירון', 'יוליוס קיסר', 'טראיאנוס'],
      correctIndex: 0,
    })
  })

  it('accepts the correct option and rejects distractors', () => {
    expect(checkQuestionAnswer(firstContactMission.answerConfig, '0')).toBe(true)
    expect(checkQuestionAnswer(firstContactMission.answerConfig, '1')).toBe(false)
  })

  it('defines a success effect that brings the core district online', () => {
    expect(firstContactMission.successEffect).toEqual({
      kind: 'SET_STAT',
      districtId: 'core',
      stat: 'signal',
      value: 100,
    })
  })
})
