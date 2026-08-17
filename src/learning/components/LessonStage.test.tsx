// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { he } from '../../i18n'
import type { EnglishLessonConfig, MathLessonConfig } from '../types'
import { LessonStage } from './LessonStage'

const MATH_LESSON: MathLessonConfig = {
  id: 'lesson:math-001',
  subject: 'math',
  title: 'חשבון בסיסי',
  instructions: 'כמה זה 3 + 4 × 2?',
  exercise: { correctAnswer: 11, hint: 'בצע קודם את הכפל.' },
}

const ENGLISH_LESSON: EnglishLessonConfig = {
  id: 'lesson:english-001',
  subject: 'english',
  title: 'אוצר מילים באנגלית',
  instructions: 'תרגם/י.',
  exercise: { items: [{ hebrew: 'כלב', english: 'dog' }], hint: 'D' },
}

describe('LessonStage — renders the right panel for the right subject only', () => {
  it('renders MathExercisePanel, never EnglishExercisePanel, for a math lesson', () => {
    render(<LessonStage lesson={MATH_LESSON} onResult={vi.fn()} onReturnToWorld={vi.fn()} />)
    expect(screen.getByTestId('math-exercise-panel')).toBeInTheDocument()
    expect(screen.queryByTestId('english-exercise-panel')).not.toBeInTheDocument()
  })

  it('renders EnglishExercisePanel, never MathExercisePanel, for an english lesson', () => {
    render(<LessonStage lesson={ENGLISH_LESSON} onResult={vi.fn()} onReturnToWorld={vi.fn()} />)
    expect(screen.getByTestId('english-exercise-panel')).toBeInTheDocument()
    expect(screen.queryByTestId('math-exercise-panel')).not.toBeInTheDocument()
  })
})

describe('LessonStage — completion flow', () => {
  it('bubbles a wrong answer up via onResult(false) and keeps showing the exercise, not the success message', () => {
    const onResult = vi.fn()
    render(<LessonStage lesson={MATH_LESSON} onResult={onResult} onReturnToWorld={vi.fn()} />)

    fireEvent.change(screen.getByTestId('math-answer-input'), { target: { value: '7' } })
    fireEvent.click(screen.getByTestId('math-submit-button'))

    expect(onResult).toHaveBeenCalledWith(false)
    expect(screen.queryByTestId('lesson-success-message')).not.toBeInTheDocument()
    expect(screen.getByTestId('math-exercise-panel')).toBeInTheDocument()
  })

  it('bubbles a correct answer up via onResult(true) and swaps to the success message', () => {
    const onResult = vi.fn()
    render(<LessonStage lesson={MATH_LESSON} onResult={onResult} onReturnToWorld={vi.fn()} />)

    fireEvent.change(screen.getByTestId('math-answer-input'), { target: { value: '11' } })
    fireEvent.click(screen.getByTestId('math-submit-button'))

    expect(onResult).toHaveBeenCalledWith(true)
    expect(screen.getByTestId('lesson-success-message')).toHaveTextContent(he.lessonSuccessMessage)
    expect(screen.queryByTestId('math-exercise-panel')).not.toBeInTheDocument()
  })

  // Bug-fix pass: LessonStage no longer accepts an isCompleted prop — a
  // fresh mount (exactly what GameApp gives it every time a lesson is
  // opened, whether via "Start Lesson" or "תרגל שוב") always shows the
  // exercise fresh, never the success message, regardless of persisted
  // completion. That persisted state lives one level up, in GameApp/
  // completedLessonIds, and never reaches this component at all.
  it('always shows the exercise fresh on mount, never the success message, with no isCompleted input to override it', () => {
    render(<LessonStage lesson={MATH_LESSON} onResult={vi.fn()} onReturnToWorld={vi.fn()} />)

    expect(screen.queryByTestId('lesson-success-message')).not.toBeInTheDocument()
    expect(screen.getByTestId('math-exercise-panel')).toBeInTheDocument()
  })

  it('replaying (a fresh mount after an earlier pass) behaves exactly like the first attempt', () => {
    const { unmount } = render(<LessonStage lesson={MATH_LESSON} onResult={vi.fn()} onReturnToWorld={vi.fn()} />)
    fireEvent.change(screen.getByTestId('math-answer-input'), { target: { value: '11' } })
    fireEvent.click(screen.getByTestId('math-submit-button'))
    expect(screen.getByTestId('lesson-success-message')).toBeInTheDocument()
    unmount()

    // Simulates GameApp's real activeLessonId cycle (null -> id -> null -> id):
    // LessonStage fully unmounts and remounts, exactly like clicking the
    // dialogue's start-lesson/practice-again button again.
    render(<LessonStage lesson={MATH_LESSON} onResult={vi.fn()} onReturnToWorld={vi.fn()} />)

    expect(screen.queryByTestId('lesson-success-message')).not.toBeInTheDocument()
    expect(screen.getByTestId('math-exercise-panel')).toBeInTheDocument()
    expect(screen.getByTestId('math-answer-input')).toHaveValue(null)
  })

  it('calls onReturnToWorld when the return button is clicked, whether or not the lesson passed yet', () => {
    const onReturnToWorld = vi.fn()
    render(<LessonStage lesson={MATH_LESSON} onResult={vi.fn()} onReturnToWorld={onReturnToWorld} />)

    fireEvent.click(screen.getByTestId('lesson-return-to-world-button'))
    expect(onReturnToWorld).toHaveBeenCalledTimes(1)
  })
})

describe('LessonStage — success wording (Batch 3A.5)', () => {
  it('shows a distinct what-to-do-next line alongside the success message, once passed', () => {
    render(<LessonStage lesson={MATH_LESSON} onResult={vi.fn()} onReturnToWorld={vi.fn()} />)
    fireEvent.change(screen.getByTestId('math-answer-input'), { target: { value: '11' } })
    fireEvent.click(screen.getByTestId('math-submit-button'))

    const nextSteps = screen.getByTestId('lesson-success-next-steps')
    expect(nextSteps).toHaveTextContent(he.lessonSuccessNextStepsMessage)
    expect(nextSteps.textContent).not.toBe(screen.getByTestId('lesson-success-message').textContent)
  })

  it('does not show the next-steps line while the exercise is still active', () => {
    render(<LessonStage lesson={MATH_LESSON} onResult={vi.fn()} onReturnToWorld={vi.fn()} />)
    expect(screen.queryByTestId('lesson-success-next-steps')).not.toBeInTheDocument()
  })
})

describe('LessonStage — return-to-world button is unique across every render state and never triggers onResult', () => {
  it('renders exactly one return-to-world button for a math lesson while the exercise is active, including after a wrong answer', () => {
    render(<LessonStage lesson={MATH_LESSON} onResult={vi.fn()} onReturnToWorld={vi.fn()} />)
    expect(screen.getAllByTestId('lesson-return-to-world-button')).toHaveLength(1)

    fireEvent.change(screen.getByTestId('math-answer-input'), { target: { value: '7' } })
    fireEvent.click(screen.getByTestId('math-submit-button'))
    expect(screen.getAllByTestId('lesson-return-to-world-button')).toHaveLength(1)
  })

  it('renders exactly one return-to-world button for a math lesson after a passing answer (success state)', () => {
    render(<LessonStage lesson={MATH_LESSON} onResult={vi.fn()} onReturnToWorld={vi.fn()} />)
    fireEvent.change(screen.getByTestId('math-answer-input'), { target: { value: '11' } })
    fireEvent.click(screen.getByTestId('math-submit-button'))

    expect(screen.getByTestId('lesson-success-message')).toBeInTheDocument()
    expect(screen.getAllByTestId('lesson-return-to-world-button')).toHaveLength(1)
  })

  it('renders exactly one return-to-world button for an english lesson while the exercise is active, including after a wrong answer', () => {
    render(<LessonStage lesson={ENGLISH_LESSON} onResult={vi.fn()} onReturnToWorld={vi.fn()} />)
    expect(screen.getAllByTestId('lesson-return-to-world-button')).toHaveLength(1)

    fireEvent.change(screen.getByTestId('english-answer-input-0'), { target: { value: 'cat' } })
    fireEvent.click(screen.getByTestId('english-submit-button'))
    expect(screen.getAllByTestId('lesson-return-to-world-button')).toHaveLength(1)
  })

  it('renders exactly one return-to-world button for an english lesson after a passing answer (success state)', () => {
    render(<LessonStage lesson={ENGLISH_LESSON} onResult={vi.fn()} onReturnToWorld={vi.fn()} />)
    fireEvent.change(screen.getByTestId('english-answer-input-0'), { target: { value: 'dog' } })
    fireEvent.click(screen.getByTestId('english-submit-button'))

    expect(screen.getByTestId('lesson-success-message')).toBeInTheDocument()
    expect(screen.getAllByTestId('lesson-return-to-world-button')).toHaveLength(1)
  })

  it('clicking the return button while the exercise is active calls onReturnToWorld exactly once and never calls onResult', () => {
    const onResult = vi.fn()
    const onReturnToWorld = vi.fn()
    render(<LessonStage lesson={MATH_LESSON} onResult={onResult} onReturnToWorld={onReturnToWorld} />)

    fireEvent.click(screen.getByTestId('lesson-return-to-world-button'))

    expect(onReturnToWorld).toHaveBeenCalledTimes(1)
    expect(onResult).not.toHaveBeenCalled()
  })

  it('clicking the return button after a passing answer still calls onReturnToWorld exactly once, with no additional onResult calls', () => {
    const onResult = vi.fn()
    const onReturnToWorld = vi.fn()
    render(<LessonStage lesson={MATH_LESSON} onResult={onResult} onReturnToWorld={onReturnToWorld} />)

    fireEvent.change(screen.getByTestId('math-answer-input'), { target: { value: '11' } })
    fireEvent.click(screen.getByTestId('math-submit-button'))
    expect(onResult).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByTestId('lesson-return-to-world-button'))

    expect(onReturnToWorld).toHaveBeenCalledTimes(1)
    expect(onResult).toHaveBeenCalledTimes(1)
  })
})
