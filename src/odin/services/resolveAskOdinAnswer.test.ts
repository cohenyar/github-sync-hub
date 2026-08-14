import { describe, expect, it } from 'vitest'
import { he } from '../../i18n'
import { resolveAskOdinAnswer, type AskOdinContext } from './resolveAskOdinAnswer'

const baseContext: AskOdinContext = {
  subjectHe: 'היסטוריה',
  missionGoal: 'לזהות מי נחשב לקיסר הראשון של האימפריה הרומית.',
  missionPrompt: 'אוגוסטוס נחשב לקיסר הרומי הראשון, ששלט אחרי נפילת הרפובליקה הרומית.',
  missionHint: 'רמז: הוא היה בן-אחיו המאומץ של יוליוס קיסר.',
  guidanceLevel1: 'שימו לב: התשובה מוזכרת במפורש בטקסט שלמעלה.',
  guidanceLevel3: 'חשבו מי המשיך את דרכו של יוליוס קיסר לאחר מלחמת האזרחים.',
  destinationName: 'מוקד הרשומות',
  lastResult: null,
}

describe('resolveAskOdinAnswer (general educational assistant pass)', () => {
  it('"what-now" answers with the mission\'s own actionable goal', () => {
    expect(resolveAskOdinAnswer('what-now', baseContext)).toBe(baseContext.missionGoal)
  })

  it('"subject" names the mission\'s subject', () => {
    expect(resolveAskOdinAnswer('subject', baseContext)).toBe(`${he.askOdinSubjectPrefix}היסטוריה.`)
  })

  it('"explain-question" answers with the full authored explanation, distinct from the goal', () => {
    expect(resolveAskOdinAnswer('explain-question', baseContext)).toBe(baseContext.missionPrompt)
  })

  describe('"hint"', () => {
    it('prefers guidanceLevel1 at Easy difficulty', () => {
      expect(resolveAskOdinAnswer('hint', { ...baseContext, difficultyLevel: 1 })).toBe(baseContext.guidanceLevel1)
    })

    it('falls back to missionHint at Medium/omitted difficulty when no guidanceLevel2 is authored', () => {
      expect(resolveAskOdinAnswer('hint', { ...baseContext, difficultyLevel: 2 })).toBe(baseContext.missionHint)
      expect(resolveAskOdinAnswer('hint', baseContext)).toBe(baseContext.missionHint)
    })

    it('prefers guidanceLevel3 at Hard difficulty, and it never reveals the answer', () => {
      const answer = resolveAskOdinAnswer('hint', { ...baseContext, difficultyLevel: 3 })
      expect(answer).toBe(baseContext.guidanceLevel3)
      expect(answer).not.toContain('אוגוסטוס')
    })

    it('falls back to a minimal, non-revealing message at Hard when no guidanceLevel3 is authored', () => {
      const { guidanceLevel3, ...withoutGuidance } = baseContext
      expect(resolveAskOdinAnswer('hint', { ...withoutGuidance, difficultyLevel: 3 })).toBe(he.askOdinHintMinimalAtHard)
    })

    it('falls back to a clear message when nothing is authored at all', () => {
      const { missionHint, guidanceLevel1, guidanceLevel3, ...bare } = baseContext
      expect(resolveAskOdinAnswer('hint', bare)).toBe(he.askOdinNoHintFallback)
    })
  })

  describe('"why-wrong"', () => {
    it('falls back to a clear message when nothing has been submitted yet this session', () => {
      expect(resolveAskOdinAnswer('why-wrong', baseContext)).toBe(he.askOdinNoWrongAnswerYetFallback)
    })

    it('says so when the most recent submission was actually correct', () => {
      const context = { ...baseContext, lastResult: { pass: true, submittedAnswer: '0' } }
      expect(resolveAskOdinAnswer('why-wrong', context)).toBe(he.askOdinLastAnswerWasCorrectFallback)
    })

    it('gives the same difficulty-gated guidance as "hint" when the last submission was wrong', () => {
      const context = { ...baseContext, lastResult: { pass: false, submittedAnswer: '1' }, difficultyLevel: 1 as const }
      expect(resolveAskOdinAnswer('why-wrong', context)).toBe(baseContext.guidanceLevel1)
    })

    it('never reveals the correct answer at Hard difficulty', () => {
      const context = { ...baseContext, lastResult: { pass: false, submittedAnswer: '1' }, difficultyLevel: 3 as const }
      const answer = resolveAskOdinAnswer('why-wrong', context)
      expect(answer).not.toContain('אוגוסטוס')
    })
  })

  it('"where-to-go" names the active destination when one is known', () => {
    expect(resolveAskOdinAnswer('where-to-go', baseContext)).toBe(`${he.askOdinWhereToGoPrefix}מוקד הרשומות.`)
  })

  it('"where-to-go" falls back to a clear message when no destination is known', () => {
    expect(resolveAskOdinAnswer('where-to-go', { ...baseContext, destinationName: undefined })).toBe(
      he.askOdinNoDestinationFallback,
    )
  })

  it('never mentions SQL-learning terms in any answer', () => {
    const sqlTerms = /SQL|SELECT|FROM|query|citizens|database table/i
    const allAnswers = [
      resolveAskOdinAnswer('what-now', baseContext),
      resolveAskOdinAnswer('subject', baseContext),
      resolveAskOdinAnswer('explain-question', baseContext),
      resolveAskOdinAnswer('hint', baseContext),
      resolveAskOdinAnswer('why-wrong', baseContext),
      resolveAskOdinAnswer('where-to-go', baseContext),
    ]
    for (const answer of allAnswers) {
      expect(answer).not.toMatch(sqlTerms)
    }
  })
})
