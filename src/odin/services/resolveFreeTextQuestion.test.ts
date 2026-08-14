import { describe, expect, it, vi } from 'vitest'
import { he } from '../../i18n'
import { resolveFreeTextQuestion, type FreeTextAskOdinContext } from './resolveFreeTextQuestion'

const baseContext: FreeTextAskOdinContext = {
  subjectHe: 'היסטוריה',
  missionGoal: 'לזהות מי נחשב לקיסר הראשון של האימפריה הרומית.',
  missionPrompt: 'אוגוסטוס נחשב לקיסר הרומי הראשון, ששלט אחרי נפילת הרפובליקה הרומית.',
  missionTask: 'מי היה הקיסר הראשון של רומא?',
  missionHint: 'רמז: הוא היה בן-אחיו המאומץ של יוליוס קיסר.',
  destinationName: 'מוקד הרשומות',
  lastResult: null,
}

describe('resolveFreeTextQuestion (deterministic, no AI)', () => {
  it('recognizes a hint request', () => {
    expect(resolveFreeTextQuestion('תן לי רמז', baseContext)).toBe(baseContext.missionHint)
  })

  it('recognizes a "what do I do now" request', () => {
    expect(resolveFreeTextQuestion('מה לעשות עכשיו?', baseContext)).toBe(baseContext.missionGoal)
  })

  it('recognizes an "explain" request', () => {
    expect(resolveFreeTextQuestion('תסביר לי את השאלה', baseContext)).toBe(baseContext.missionPrompt)
  })

  it('recognizes a "what does this mean" request as an explain intent', () => {
    expect(resolveFreeTextQuestion('מה פירוש המילה?', baseContext)).toBe(baseContext.missionPrompt)
  })

  it('recognizes a "why is this correct" request as an explain intent, distinct from why-wrong', () => {
    expect(resolveFreeTextQuestion('למה התשובה הזאת נכונה?', baseContext)).toBe(baseContext.missionPrompt)
  })

  it('recognizes a "what is the subject" request', () => {
    expect(resolveFreeTextQuestion('מה הנושא של המשימה?', baseContext)).toBe(`${he.askOdinSubjectPrefix}היסטוריה.`)
  })

  it('recognizes a "where do I go" request', () => {
    expect(resolveFreeTextQuestion('לאן ללכת עכשיו?', baseContext)).toBe(
      `${he.askOdinWhereToGoPrefix}מוקד הרשומות.`,
    )
  })

  it('recognizes a "why did I get it wrong" request, distinct from an explain request', () => {
    const context = { ...baseContext, lastResult: { pass: false, submittedAnswer: '1' } }
    expect(resolveFreeTextQuestion('למה טעיתי?', context)).toBe(baseContext.missionHint)
  })

  it('answers a subject question directly available from the authored content, without inventing facts', () => {
    expect(resolveFreeTextQuestion('מי היה אוגוסטוס?', baseContext)).toBe(baseContext.missionPrompt)
  })

  it('gives the safe fallback for a question unrelated to the current mission, and never invents an answer', () => {
    expect(resolveFreeTextQuestion('מה השעה עכשיו?', baseContext)).toBe(he.askOdinUnknownQuestionFallback)
  })

  it('gives the safe fallback for an empty question', () => {
    expect(resolveFreeTextQuestion('   ', baseContext)).toBe(he.askOdinUnknownQuestionFallback)
  })

  it('never reveals the correct answer at Hard difficulty, even via the content-overlap fallback', () => {
    const context = { ...baseContext, difficultyLevel: 3 as const, lastResult: { pass: false, submittedAnswer: '1' } }
    const answer = resolveFreeTextQuestion('למה טעיתי?', context)
    expect(answer).not.toContain('אוגוסטוס')
  })

  it('never calls fetch or any network API while resolving any question — deterministic only, no AI API', () => {
    const fetchSpy = vi.fn()
    const originalFetch = globalThis.fetch
    globalThis.fetch = fetchSpy as typeof fetch

    try {
      const inputs = ['תן לי רמז', 'מה לעשות עכשיו?', 'תסביר', 'מה הנושא?', 'לאן ללכת?', 'למה טעיתי?', 'שאלה אקראית לגמרי']
      for (const input of inputs) {
        resolveFreeTextQuestion(input, baseContext)
      }
      expect(fetchSpy).not.toHaveBeenCalled()
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
