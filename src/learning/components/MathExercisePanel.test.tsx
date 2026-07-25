// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { he } from '../../i18n'
import type { MathLessonConfig } from '../types'
import { MathExercisePanel } from './MathExercisePanel'

const LESSON: MathLessonConfig = {
  id: 'lesson:math-001',
  subject: 'math',
  title: 'חשבון בסיסי',
  instructions: 'כמה זה 3 + 4 × 2?',
  exercise: { correctAnswer: 11, hint: 'בצע קודם את הכפל.' },
}

describe('MathExercisePanel', () => {
  it('renders the Hebrew instructions', () => {
    render(<MathExercisePanel lesson={LESSON} />)
    expect(screen.getByText(LESSON.instructions)).toBeInTheDocument()
  })

  it('shows correct feedback and calls onResult(true) for the right answer', () => {
    const onResult = vi.fn()
    render(<MathExercisePanel lesson={LESSON} onResult={onResult} />)

    fireEvent.change(screen.getByTestId('math-answer-input'), { target: { value: '11' } })
    fireEvent.click(screen.getByTestId('math-submit-button'))

    expect(screen.getByTestId('math-exercise-feedback')).toHaveTextContent(he.exerciseCorrectFeedback)
    expect(onResult).toHaveBeenCalledWith(true)
  })

  it('shows incorrect feedback and calls onResult(false) for the wrong answer', () => {
    const onResult = vi.fn()
    render(<MathExercisePanel lesson={LESSON} onResult={onResult} />)

    fireEvent.change(screen.getByTestId('math-answer-input'), { target: { value: '7' } })
    fireEvent.click(screen.getByTestId('math-submit-button'))

    expect(screen.getByTestId('math-exercise-feedback')).toHaveTextContent(he.exerciseIncorrectFeedback)
    expect(onResult).toHaveBeenCalledWith(false)
  })

  it('hint text is hidden until the hint button is clicked', () => {
    render(<MathExercisePanel lesson={LESSON} />)
    expect(screen.queryByTestId('math-hint-text')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('math-hint-button'))

    expect(screen.getByTestId('math-hint-text')).toHaveTextContent(LESSON.exercise.hint)
  })
})
