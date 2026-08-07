// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { he } from '../../i18n'
import type { OdinNarrationEntry } from '../types'
import { AskOdinPanel } from './AskOdinPanel'

const BASE_PROPS = {
  missionGoal: 'הפעל/י את מוקד הרשומות.',
  missionPrompt: 'מוקד הרשומות עיוור. שאל/י את מרשם התושבים.',
  missionHint: 'רמז: תצטרך/י להביא את כל השורות מטבלת citizens.',
  destinationName: 'מוקד הרשומות',
  history: [] as readonly OdinNarrationEntry[],
}

describe('AskOdinPanel (playtest fix, issue 6C)', () => {
  it('shows all five deterministic questions, and no answer until one is asked', () => {
    render(<AskOdinPanel {...BASE_PROPS} />)

    expect(screen.getByTestId('ask-odin-what-now')).toHaveTextContent(he.askOdinWhatNowLabel)
    expect(screen.getByTestId('ask-odin-hint')).toHaveTextContent(he.askOdinHintLabel)
    expect(screen.getByTestId('ask-odin-explain-mission')).toHaveTextContent(he.askOdinExplainLabel)
    expect(screen.getByTestId('ask-odin-why-failed')).toHaveTextContent(he.askOdinWhyFailedLabel)
    expect(screen.getByTestId('ask-odin-where-to-go')).toHaveTextContent(he.askOdinWhereToGoLabel)
    expect(screen.queryByTestId('ask-odin-answer')).not.toBeInTheDocument()
  })

  it('answers "what to do now" with the mission goal', () => {
    render(<AskOdinPanel {...BASE_PROPS} />)
    fireEvent.click(screen.getByTestId('ask-odin-what-now'))
    expect(screen.getByTestId('ask-odin-answer')).toHaveTextContent(BASE_PROPS.missionGoal)
  })

  it('switches the answer when a different question is asked', () => {
    render(<AskOdinPanel {...BASE_PROPS} />)
    fireEvent.click(screen.getByTestId('ask-odin-what-now'))
    expect(screen.getByTestId('ask-odin-answer')).toHaveTextContent(BASE_PROPS.missionGoal)

    fireEvent.click(screen.getByTestId('ask-odin-explain-mission'))
    expect(screen.getByTestId('ask-odin-answer')).toHaveTextContent(BASE_PROPS.missionPrompt)
    expect(screen.getByTestId('ask-odin-answer')).not.toHaveTextContent(BASE_PROPS.missionGoal)
  })

  it('answers "why didn\'t it work" from the most recent QueryFailed narration in history, ignoring other event types', () => {
    const history: OdinNarrationEntry[] = [
      { id: '1', message: 'משימה חדשה מתחילה: מגע ראשון. אני מקשיב.', sequence: 1, event: { type: 'MissionStarted', missionId: 'first-contact' } },
      {
        id: '2',
        message: 'יש שגיאת תחביר בשאילתה — בדוק/י אם חסר פסיק, מרכאות או סוגריים.',
        sequence: 2,
        event: { type: 'QueryFailed', missionId: 'first-contact', reason: 'sql-error', sqlErrorKind: 'syntax' },
      },
    ]
    render(<AskOdinPanel {...BASE_PROPS} history={history} />)
    fireEvent.click(screen.getByTestId('ask-odin-why-failed'))
    expect(screen.getByTestId('ask-odin-answer')).toHaveTextContent(
      'יש שגיאת תחביר בשאילתה — בדוק/י אם חסר פסיק, מרכאות או סוגריים.',
    )
  })

  it('falls back to a clear message when nothing has failed yet', () => {
    render(<AskOdinPanel {...BASE_PROPS} />)
    fireEvent.click(screen.getByTestId('ask-odin-why-failed'))
    expect(screen.getByTestId('ask-odin-answer')).toHaveTextContent(he.askOdinNoErrorYetFallback)
  })
})
