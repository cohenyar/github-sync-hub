import { describe, expect, it } from 'vitest'
import { checkQuestionAnswer } from './checkQuestionAnswer'
import { districtTiesMission } from './districtTies'

describe('districtTiesMission', () => {
  it('is an English vocabulary question mission', () => {
    expect(districtTiesMission.subjectHe).toBe('אנגלית')
  })

  it('asks for the translation of "ספרייה" as multiple choice', () => {
    expect(districtTiesMission.answerConfig).toEqual({
      type: 'multiple_choice',
      options: ['Library', 'School', 'Market', 'Hospital'],
      correctIndex: 0,
    })
  })

  it('accepts the correct option and rejects distractors', () => {
    expect(checkQuestionAnswer(districtTiesMission.answerConfig, '0')).toBe(true)
    expect(checkQuestionAnswer(districtTiesMission.answerConfig, '2')).toBe(false)
  })

  it('defines a success effect that strengthens loyalty in the North district', () => {
    expect(districtTiesMission.successEffect).toEqual({
      kind: 'ADJUST_STAT',
      districtId: 'north',
      stat: 'loyalty',
      delta: 15,
    })
  })
})
