import { describe, expect, it } from 'vitest'
import { checkQuestionAnswer } from './checkQuestionAnswer'
import { linkedRecordsMission } from './linkedRecords'

describe('linkedRecordsMission', () => {
  it('is an English vocabulary question mission', () => {
    expect(linkedRecordsMission.subjectHe).toBe('אנגלית')
  })

  it('asks for the translation of "ספר" as a short-text answer', () => {
    expect(linkedRecordsMission.answerConfig).toEqual({ type: 'exact_text', acceptedAnswers: ['book'] })
  })

  it('accepts the correct answer case/whitespace-insensitively and rejects a wrong one', () => {
    expect(checkQuestionAnswer(linkedRecordsMission.answerConfig, 'book')).toBe(true)
    expect(checkQuestionAnswer(linkedRecordsMission.answerConfig, ' BOOK ')).toBe(true)
    expect(checkQuestionAnswer(linkedRecordsMission.answerConfig, 'pen')).toBe(false)
  })

  it('defines a success effect that improves stability in the North district', () => {
    expect(linkedRecordsMission.successEffect).toEqual({
      kind: 'ADJUST_STAT',
      districtId: 'north',
      stat: 'stability',
      delta: 15,
    })
  })
})
