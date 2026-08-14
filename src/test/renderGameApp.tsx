import { fireEvent, render, screen } from '@testing-library/react'
import GameApp, { type GameAppProps } from '../GameApp'

/**
 * Meridian 1.4 — the Welcome Screen shows on every mount of GameApp, and a
 * first-time player (no local profile yet) is then routed through the
 * mandatory Profile Creation screen before anything else. Nearly every
 * existing integration test predates both and renders <GameApp/> expecting
 * immediate access to the boot sequence/world scene. This drives the real
 * screens via their real UI (same reasoning as e2e/helpers.ts's
 * passEntryGates) rather than hand-seeding a matching save blob, which
 * would duplicate PlayerProgress's real shape and drift out of sync with
 * it. Exported separately from renderGameApp so a test that unmounts and
 * re-renders GameApp mid-test (a real "reload" scenario) can call it again
 * after the second render.
 */
export function passEntryGates(): void {
  const continueButton = screen.queryByTestId('welcome-continue-button')
  if (continueButton) fireEvent.click(continueButton)

  const nameInput = screen.queryByTestId('profile-name-input')
  if (nameInput) {
    fireEvent.change(nameInput, { target: { value: 'שחקן/ית לדוגמה' } })
    fireEvent.click(screen.getByTestId('profile-submit-button'))
  }
}

/** Renders <GameApp/> and immediately passes the Welcome Screen and (for a fresh profile) Profile Creation — the drop-in replacement for `render(<GameApp .../>)` used throughout this suite. */
export function renderGameApp(props?: GameAppProps): ReturnType<typeof render> {
  const result = render(<GameApp {...props} />)
  passEntryGates()
  return result
}

/**
 * SQL-removal pass — the question-mission counterpart to the old
 * "type SQL into the textarea and click Run" pattern used throughout the
 * integration suite. Selects the given option (0-based, matching each
 * mission's answerConfig.options order) on a multiple-choice question and
 * submits it. See submitShortTextAnswer for a short-text question.
 */
export function submitMultipleChoiceAnswer(optionIndex: number): void {
  fireEvent.click(screen.getByTestId(`question-option-${optionIndex}`))
  fireEvent.click(screen.getByTestId('question-submit-button'))
}

/** The short-text counterpart to submitMultipleChoiceAnswer — types the given answer and submits it. */
export function submitShortTextAnswer(answer: string): void {
  fireEvent.change(screen.getByTestId('question-answer-input'), { target: { value: answer } })
  fireEvent.click(screen.getByTestId('question-submit-button'))
}
