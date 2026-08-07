import { describe, expect, it } from 'vitest'
import { he } from '../../i18n'
import { resolveAskOdinAnswer } from './resolveAskOdinAnswer'

const baseContext = {
  missionGoal: 'הפעל/י את מוקד הרשומות.',
  missionPrompt: 'מוקד הרשומות עיוור. שאל/י את מרשם התושבים.',
  missionHint: 'רמז: תצטרך/י להביא את כל השורות מטבלת citizens.',
  destinationName: 'מוקד הרשומות',
  lastQueryFailedMessage: null,
}

describe('resolveAskOdinAnswer (playtest fix, issue 6C)', () => {
  it('"what-now" answers with the mission\'s own actionable goal', () => {
    expect(resolveAskOdinAnswer('what-now', baseContext)).toBe(baseContext.missionGoal)
  })

  it('"explain-mission" answers with the full narrative prompt, distinct from the goal', () => {
    expect(resolveAskOdinAnswer('explain-mission', baseContext)).toBe(baseContext.missionPrompt)
  })

  it('"hint" answers with the mission\'s authored hint when one exists', () => {
    expect(resolveAskOdinAnswer('hint', baseContext)).toBe(baseContext.missionHint)
  })

  it('"hint" falls back to a clear message when no hint is authored yet', () => {
    expect(resolveAskOdinAnswer('hint', { ...baseContext, missionHint: undefined })).toBe(he.askOdinNoHintFallback)
  })

  it('"why-failed" answers with the most recent QueryFailed narration when one exists', () => {
    const message = 'יש שגיאת תחביר בשאילתה — בדוק/י אם חסר פסיק, מרכאות או סוגריים.'
    expect(resolveAskOdinAnswer('why-failed', { ...baseContext, lastQueryFailedMessage: message })).toBe(message)
  })

  it('"why-failed" falls back to a clear message when nothing has failed yet this session', () => {
    expect(resolveAskOdinAnswer('why-failed', baseContext)).toBe(he.askOdinNoErrorYetFallback)
  })

  it('"where-to-go" names the active destination when one is known', () => {
    expect(resolveAskOdinAnswer('where-to-go', baseContext)).toBe(`${he.askOdinWhereToGoPrefix}מוקד הרשומות.`)
  })

  it('"where-to-go" falls back to a clear message when no destination is known', () => {
    expect(resolveAskOdinAnswer('where-to-go', { ...baseContext, destinationName: undefined })).toBe(
      he.askOdinNoDestinationFallback,
    )
  })
})
