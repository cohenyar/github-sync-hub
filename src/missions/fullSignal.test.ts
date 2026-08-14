import { describe, expect, it } from 'vitest'
import { checkQuestionAnswer } from './checkQuestionAnswer'
import { fullSignalMission } from './fullSignal'

describe('fullSignalMission', () => {
  it('is a History question mission', () => {
    expect(fullSignalMission.subjectHe).toBe('היסטוריה')
  })

  it('asks about the first U.S. president as multiple choice', () => {
    expect(fullSignalMission.answerConfig).toEqual({
      type: 'multiple_choice',
      options: ["ג'ורג' וושינגטון", 'אברהם לינקולן', "תומאס ג'פרסון", "בנג'מין פרנקלין"],
      correctIndex: 0,
    })
  })

  it('accepts the correct option and rejects distractors', () => {
    expect(checkQuestionAnswer(fullSignalMission.answerConfig, '0')).toBe(true)
    expect(checkQuestionAnswer(fullSignalMission.answerConfig, '3')).toBe(false)
  })

  it('defines a success effect that advances the turn', () => {
    expect(fullSignalMission.successEffect).toEqual({ kind: 'ADVANCE_TURN' })
  })
})
