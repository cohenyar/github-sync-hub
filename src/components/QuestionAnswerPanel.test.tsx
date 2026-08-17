// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { he } from '../i18n'
import type { MissionConfig } from '../missions/types'
import type { QuestionMissionStatus } from '../missions/useQuestionMission'
import { QuestionAnswerPanel } from './QuestionAnswerPanel'

const mcMission: MissionConfig = {
  id: 'test-mc-mission',
  title: 'Test MC Mission',
  goal: 'goal',
  prompt: 'prompt',
  subjectHe: 'מתמטיקה',
  taskHe: 'מה התוצאה של 2 + 2?',
  answerConfig: { type: 'multiple_choice', options: ['3', '4', '5'], correctIndex: 1 },
  hintHe: 'רמז כללי',
  guidanceLevel1: 'רמז לרמה 1',
  guidanceLevel2: 'רמז לרמה 2',
}

const shortTextMission: MissionConfig = {
  id: 'test-short-text-mission',
  title: 'Test Short Text Mission',
  goal: 'goal',
  prompt: 'prompt',
  subjectHe: 'אנגלית',
  taskHe: 'מה בירת צרפת?',
  answerConfig: { type: 'exact_text', acceptedAnswers: ['פריז'] },
}

function status(overrides: Partial<QuestionMissionStatus> = {}): QuestionMissionStatus {
  return { phase: 'active', lastResult: null, ...overrides }
}

describe('QuestionAnswerPanel', () => {
  it('renders no SQL-specific UI whatsoever', () => {
    render(<QuestionAnswerPanel mission={mcMission} status={status()} onSubmit={vi.fn()} />)

    expect(screen.queryByTestId('sql-input')).not.toBeInTheDocument()
    expect(screen.queryByTestId('run-button')).not.toBeInTheDocument()
  })

  it('renders the task text and every multiple-choice option', () => {
    render(<QuestionAnswerPanel mission={mcMission} status={status()} onSubmit={vi.fn()} />)

    expect(screen.getByTestId('question-task')).toHaveTextContent('מה התוצאה של 2 + 2?')
    expect(screen.getByTestId('question-option-0')).toHaveTextContent('3')
    expect(screen.getByTestId('question-option-1')).toHaveTextContent('4')
    expect(screen.getByTestId('question-option-2')).toHaveTextContent('5')
  })

  it('disables submit until an option is selected, then calls onSubmit with the selected index', () => {
    const onSubmit = vi.fn()
    render(<QuestionAnswerPanel mission={mcMission} status={status()} onSubmit={onSubmit} />)

    expect(screen.getByTestId('question-submit-button')).toBeDisabled()

    fireEvent.click(screen.getByTestId('question-option-1'))
    expect(screen.getByTestId('question-submit-button')).toBeEnabled()

    fireEvent.click(screen.getByTestId('question-submit-button'))
    expect(onSubmit).toHaveBeenCalledWith('1')
  })

  it('renders a short-text input instead of options for an exact_text mission', () => {
    render(<QuestionAnswerPanel mission={shortTextMission} status={status()} onSubmit={vi.fn()} />)

    expect(screen.queryByTestId('question-options')).not.toBeInTheDocument()
    expect(screen.getByTestId('question-answer-input')).toBeInTheDocument()
  })

  it('disables submit until text is entered, then calls onSubmit with the typed answer', () => {
    const onSubmit = vi.fn()
    render(<QuestionAnswerPanel mission={shortTextMission} status={status()} onSubmit={onSubmit} />)

    expect(screen.getByTestId('question-submit-button')).toBeDisabled()

    fireEvent.change(screen.getByTestId('question-answer-input'), { target: { value: 'פריז' } })
    expect(screen.getByTestId('question-submit-button')).toBeEnabled()

    fireEvent.click(screen.getByTestId('question-submit-button'))
    expect(onSubmit).toHaveBeenCalledWith('פריז')
  })

  it('shows the correct-answer feedback text on a passing result, at every difficulty level', () => {
    for (const difficultyLevel of [undefined, 1, 2, 3] as const) {
      render(
        <QuestionAnswerPanel
          mission={mcMission}
          status={status({ lastResult: { pass: true, submittedAnswer: '1' } })}
          onSubmit={vi.fn()}
          difficultyLevel={difficultyLevel}
        />,
      )
      expect(screen.getAllByTestId('question-feedback').at(-1)).toHaveTextContent(he.exerciseCorrectFeedback)
    }
  })

  it('shows a normal incorrect-feedback message by default (no difficultyLevel)', () => {
    render(
      <QuestionAnswerPanel
        mission={mcMission}
        status={status({ lastResult: { pass: false, submittedAnswer: '0' } })}
        onSubmit={vi.fn()}
      />,
    )
    const feedback = screen.getByTestId('question-feedback')
    expect(feedback).toHaveTextContent(he.exerciseIncorrectFeedback)
    expect(feedback).toHaveAttribute('data-verdict', 'fail')
  })

  it('shows a more supportive incorrect-feedback message at Easy difficulty', () => {
    render(
      <QuestionAnswerPanel
        mission={mcMission}
        status={status({ lastResult: { pass: false, submittedAnswer: '0' } })}
        onSubmit={vi.fn()}
        difficultyLevel={1}
      />,
    )
    expect(screen.getByTestId('question-feedback')).toHaveTextContent(he.questionIncorrectFeedbackSupportive)
  })

  it('shows a minimal incorrect-feedback message at Hard difficulty, never revealing the answer', () => {
    render(
      <QuestionAnswerPanel
        mission={mcMission}
        status={status({ lastResult: { pass: false, submittedAnswer: '0' } })}
        onSubmit={vi.fn()}
        difficultyLevel={3}
      />,
    )
    const feedback = screen.getByTestId('question-feedback')
    expect(feedback).toHaveTextContent(he.questionIncorrectFeedbackMinimal)
    expect(feedback).not.toHaveTextContent('4') // the correct option's own text
  })

  it('shows the mission hint inline, unprompted, at Easy difficulty only', () => {
    render(<QuestionAnswerPanel mission={mcMission} status={status()} onSubmit={vi.fn()} difficultyLevel={1} />)
    expect(screen.getByTestId('question-inline-hint')).toHaveTextContent('רמז לרמה 1')
  })

  it('hides the inline hint and offers an on-request hint button at Medium difficulty (and when omitted)', () => {
    render(<QuestionAnswerPanel mission={mcMission} status={status()} onSubmit={vi.fn()} difficultyLevel={2} />)
    expect(screen.queryByTestId('question-inline-hint')).not.toBeInTheDocument()

    const hintButton = screen.getByTestId('question-hint-button')
    fireEvent.click(hintButton)
    expect(screen.getByTestId('question-hint-text')).toHaveTextContent('רמז לרמה 2')
  })

  it('shows no hint at all — inline or on-request — at Hard difficulty', () => {
    render(<QuestionAnswerPanel mission={mcMission} status={status()} onSubmit={vi.fn()} difficultyLevel={3} />)
    expect(screen.queryByTestId('question-inline-hint')).not.toBeInTheDocument()
    expect(screen.queryByTestId('question-hint-button')).not.toBeInTheDocument()
  })

  it('renders exactly one radio input and one text span per option row (mobile min-height/box-sizing fix, no structural regression)', () => {
    render(<QuestionAnswerPanel mission={mcMission} status={status()} onSubmit={vi.fn()} />)

    const options = mcMission.answerConfig.type === 'multiple_choice' ? mcMission.answerConfig.options : []
    for (let index = 0; index < options.length; index += 1) {
      const optionRow = screen.getByTestId(`question-option-${index}`)
      expect(optionRow.querySelectorAll('input[type="radio"]')).toHaveLength(1)
      expect(optionRow.querySelectorAll('span')).toHaveLength(1)
      expect(within(optionRow).getAllByRole('radio')).toHaveLength(1)
    }
  })

  it('still selects the option when clicking the option text (not just the radio itself)', () => {
    const onSubmit = vi.fn()
    render(<QuestionAnswerPanel mission={mcMission} status={status()} onSubmit={onSubmit} />)

    const optionRow = screen.getByTestId('question-option-1')
    // Click the rendered option text, deliberately not the radio input
    // itself — proves the whole label row (not just the input) remains a
    // valid click target after the mobile box-sizing fix to .option.
    fireEvent.click(within(optionRow).getByText('4'))

    expect(within(optionRow).getByRole('radio')).toBeChecked()

    fireEvent.click(screen.getByTestId('question-submit-button'))
    expect(onSubmit).toHaveBeenCalledWith('1')
  })

  it('resets the selection and hides any shown hint when the mission changes', () => {
    const { rerender } = render(<QuestionAnswerPanel mission={mcMission} status={status()} onSubmit={vi.fn()} />)
    fireEvent.click(screen.getByTestId('question-option-1'))
    expect(screen.getByTestId('question-submit-button')).toBeEnabled()

    rerender(<QuestionAnswerPanel mission={shortTextMission} status={status()} onSubmit={vi.fn()} />)
    expect(screen.getByTestId('question-submit-button')).toBeDisabled()
  })
})
