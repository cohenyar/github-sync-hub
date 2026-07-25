// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { he } from '../../i18n'
import type { EnglishLessonConfig } from '../types'
import { EnglishExercisePanel } from './EnglishExercisePanel'

const LESSON: EnglishLessonConfig = {
  id: 'lesson:english-001',
  subject: 'english',
  title: 'אוצר מילים באנגלית',
  instructions: 'תרגם/י את המילים הבאות מעברית לאנגלית.',
  exercise: {
    items: [
      { hebrew: 'כלב', english: 'dog' },
      { hebrew: 'חתול', english: 'cat' },
      { hebrew: 'בית', english: 'house' },
    ],
    hint: 'D',
  },
}

function fillAnswers(values: string[]) {
  values.forEach((value, index) => {
    fireEvent.change(screen.getByTestId(`english-answer-input-${index}`), { target: { value } })
  })
}

describe('EnglishExercisePanel', () => {
  it('renders the Hebrew instructions and one input per vocabulary item', () => {
    render(<EnglishExercisePanel lesson={LESSON} />)
    expect(screen.getByText(LESSON.instructions)).toBeInTheDocument()
    LESSON.exercise.items.forEach((_, index) => {
      expect(screen.getByTestId(`english-answer-input-${index}`)).toBeInTheDocument()
    })
  })

  it('shows correct feedback and calls onResult(true) when every translation matches', () => {
    const onResult = vi.fn()
    render(<EnglishExercisePanel lesson={LESSON} onResult={onResult} />)

    fillAnswers(['dog', 'cat', 'house'])
    fireEvent.click(screen.getByTestId('english-submit-button'))

    expect(screen.getByTestId('english-exercise-feedback')).toHaveTextContent(he.exerciseCorrectFeedback)
    expect(onResult).toHaveBeenCalledWith(true)
  })

  it('shows incorrect feedback and calls onResult(false) when one translation is wrong', () => {
    const onResult = vi.fn()
    render(<EnglishExercisePanel lesson={LESSON} onResult={onResult} />)

    fillAnswers(['dog', 'wrong', 'house'])
    fireEvent.click(screen.getByTestId('english-submit-button'))

    expect(screen.getByTestId('english-exercise-feedback')).toHaveTextContent(he.exerciseIncorrectFeedback)
    expect(onResult).toHaveBeenCalledWith(false)
  })

  it('hint text is hidden until the hint button is clicked', () => {
    render(<EnglishExercisePanel lesson={LESSON} />)
    expect(screen.queryByTestId('english-hint-text')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('english-hint-button'))

    expect(screen.getByTestId('english-hint-text')).toHaveTextContent(LESSON.exercise.hint)
  })
})
