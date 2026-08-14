// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { he } from '../../i18n'
import { AskOdinPanel, type AskOdinPanelProps } from './AskOdinPanel'

const BASE_PROPS: AskOdinPanelProps = {
  subjectHe: 'היסטוריה',
  missionGoal: 'לזהות מי נחשב לקיסר הראשון של האימפריה הרומית.',
  missionPrompt: 'אוגוסטוס נחשב לקיסר הרומי הראשון, ששלט אחרי נפילת הרפובליקה הרומית.',
  missionTask: 'מי היה הקיסר הראשון של רומא?',
  missionHint: 'רמז: הוא היה בן-אחיו המאומץ של יוליוס קיסר.',
  destinationName: 'מוקד הרשומות',
  lastResult: null,
}

describe('AskOdinPanel (general educational assistant pass)', () => {
  it('shows all six deterministic questions, and no answer until one is asked', () => {
    render(<AskOdinPanel {...BASE_PROPS} />)

    expect(screen.getByTestId('ask-odin-what-now')).toHaveTextContent(he.askOdinWhatNowLabel)
    expect(screen.getByTestId('ask-odin-hint')).toHaveTextContent(he.askOdinHintLabel)
    expect(screen.getByTestId('ask-odin-explain-question')).toHaveTextContent(he.askOdinExplainLabel)
    expect(screen.getByTestId('ask-odin-why-wrong')).toHaveTextContent(he.askOdinWhyWrongLabel)
    expect(screen.getByTestId('ask-odin-subject')).toHaveTextContent(he.askOdinSubjectLabel)
    expect(screen.getByTestId('ask-odin-where-to-go')).toHaveTextContent(he.askOdinWhereToGoLabel)
    expect(screen.queryByTestId('ask-odin-answer')).not.toBeInTheDocument()
  })

  it('answers "what to do now" with the mission goal', () => {
    render(<AskOdinPanel {...BASE_PROPS} />)
    fireEvent.click(screen.getByTestId('ask-odin-what-now'))
    expect(screen.getByTestId('ask-odin-answer')).toHaveTextContent(BASE_PROPS.missionGoal)
  })

  it('answers "what\'s the subject" with the mission\'s subject', () => {
    render(<AskOdinPanel {...BASE_PROPS} />)
    fireEvent.click(screen.getByTestId('ask-odin-subject'))
    expect(screen.getByTestId('ask-odin-answer')).toHaveTextContent('היסטוריה')
  })

  it('switches the answer when a different question is asked', () => {
    render(<AskOdinPanel {...BASE_PROPS} />)
    fireEvent.click(screen.getByTestId('ask-odin-what-now'))
    expect(screen.getByTestId('ask-odin-answer')).toHaveTextContent(BASE_PROPS.missionGoal)

    fireEvent.click(screen.getByTestId('ask-odin-explain-question'))
    expect(screen.getByTestId('ask-odin-answer')).toHaveTextContent(BASE_PROPS.missionPrompt)
    expect(screen.getByTestId('ask-odin-answer')).not.toHaveTextContent(BASE_PROPS.missionGoal)
  })

  it('answers "why did I get it wrong" from the last submitted result', () => {
    render(<AskOdinPanel {...BASE_PROPS} lastResult={{ pass: false, submittedAnswer: '1' }} />)
    fireEvent.click(screen.getByTestId('ask-odin-why-wrong'))
    expect(screen.getByTestId('ask-odin-answer')).toHaveTextContent(BASE_PROPS.missionHint!)
  })

  it('falls back to a clear message when nothing has been submitted yet', () => {
    render(<AskOdinPanel {...BASE_PROPS} />)
    fireEvent.click(screen.getByTestId('ask-odin-why-wrong'))
    expect(screen.getByTestId('ask-odin-answer')).toHaveTextContent(he.askOdinNoWrongAnswerYetFallback)
  })

  it('never reveals the correct answer at Hard difficulty', () => {
    render(<AskOdinPanel {...BASE_PROPS} difficultyLevel={3} lastResult={{ pass: false, submittedAnswer: '1' }} />)
    fireEvent.click(screen.getByTestId('ask-odin-why-wrong'))
    expect(screen.getByTestId('ask-odin-answer')).not.toHaveTextContent('אוגוסטוס')
  })

  describe('free-text input', () => {
    it('renders a text input and a submit button, not AI chrome', () => {
      render(<AskOdinPanel {...BASE_PROPS} />)
      expect(screen.getByTestId('ask-odin-free-text-input')).toBeInTheDocument()
      expect(screen.getByTestId('ask-odin-free-text-submit')).toBeInTheDocument()
    })

    it('disables submit until text is entered', () => {
      render(<AskOdinPanel {...BASE_PROPS} />)
      expect(screen.getByTestId('ask-odin-free-text-submit')).toBeDisabled()
      fireEvent.change(screen.getByTestId('ask-odin-free-text-input'), { target: { value: 'רמז' } })
      expect(screen.getByTestId('ask-odin-free-text-submit')).toBeEnabled()
    })

    it('recognizes a known intent phrase and answers exactly like the matching button', () => {
      render(<AskOdinPanel {...BASE_PROPS} />)
      fireEvent.change(screen.getByTestId('ask-odin-free-text-input'), { target: { value: 'תן לי רמז' } })
      fireEvent.click(screen.getByTestId('ask-odin-free-text-submit'))
      expect(screen.getByTestId('ask-odin-answer')).toHaveTextContent(BASE_PROPS.missionHint!)
    })

    it('answers a subject question directly available from the authored content', () => {
      render(<AskOdinPanel {...BASE_PROPS} />)
      fireEvent.change(screen.getByTestId('ask-odin-free-text-input'), { target: { value: 'מי היה אוגוסטוס?' } })
      fireEvent.click(screen.getByTestId('ask-odin-free-text-submit'))
      expect(screen.getByTestId('ask-odin-answer')).toHaveTextContent(BASE_PROPS.missionPrompt)
    })

    it('gives the safe fallback for a question with no answer in the authored content, and does not invent one', () => {
      render(<AskOdinPanel {...BASE_PROPS} />)
      fireEvent.change(screen.getByTestId('ask-odin-free-text-input'), { target: { value: 'מה השעה עכשיו?' } })
      fireEvent.click(screen.getByTestId('ask-odin-free-text-submit'))
      expect(screen.getByTestId('ask-odin-answer')).toHaveTextContent(he.askOdinUnknownQuestionFallback)
    })
  })
})
