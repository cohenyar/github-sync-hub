// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { he } from '../i18n'
import type { MissionStatus } from '../missions/missionManager'
import type { MissionConfig } from '../missions/types'
import { SqlEditorPanel } from './SqlEditorPanel'

const mission: MissionConfig = {
  id: 'test-mission',
  title: 'First Contact',
  goal: 'Bring the Records Core online.',
  prompt: 'Query the citizens registry.',
  setupSql: '',
  referenceSql: 'SELECT * FROM citizens',
}

function status(overrides: Partial<MissionStatus> = {}): MissionStatus {
  return { phase: 'active', mission, lastResult: null, error: null, ...overrides }
}

describe('SqlEditorPanel', () => {
  it('disables Run while the mission database is loading', () => {
    render(<SqlEditorPanel status={status({ phase: 'loading' })} onRun={vi.fn()} />)
    expect(screen.getByRole('button', { name: he.run })).toBeDisabled()
  })

  it('enables Run once the mission is active', () => {
    render(<SqlEditorPanel status={status({ phase: 'active' })} onRun={vi.fn()} />)
    expect(screen.getByRole('button', { name: he.run })).toBeEnabled()
  })

  it('keeps Run enabled once the mission is completed', () => {
    render(<SqlEditorPanel status={status({ phase: 'completed' })} onRun={vi.fn()} />)
    expect(screen.getByRole('button', { name: he.run })).toBeEnabled()
  })

  it('disables Run when the database failed to prepare', () => {
    render(<SqlEditorPanel status={status({ phase: 'error', error: 'boom' })} onRun={vi.fn()} />)
    expect(screen.getByRole('button', { name: he.run })).toBeDisabled()
  })

  it('calls onRun with the current textarea contents', () => {
    const onRun = vi.fn()
    render(<SqlEditorPanel status={status()} onRun={onRun} />)

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens' },
    })
    fireEvent.click(screen.getByRole('button', { name: he.run }))

    expect(onRun).toHaveBeenCalledWith('SELECT * FROM citizens')
  })

  it('shows a Hebrew database preparation error, never the raw technical message', () => {
    render(<SqlEditorPanel status={status({ phase: 'error', error: 'boom' })} onRun={vi.fn()} />)
    expect(screen.getByText(he.databasePrepareErrorMessage)).toBeInTheDocument()
    expect(screen.queryByText(/boom/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Failed to prepare database/)).not.toBeInTheDocument()
  })

  it('shows a retry button on a database error and calls onRetry when clicked', () => {
    const onRetry = vi.fn()
    render(<SqlEditorPanel status={status({ phase: 'error', error: 'boom' })} onRun={vi.fn()} onRetry={onRetry} />)

    const retryButton = screen.getByTestId('retry-database-button')
    expect(retryButton).toHaveTextContent(he.retryDatabaseSetup)

    fireEvent.click(retryButton)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('shows no retry button when onRetry is not provided, or when there is no database error', () => {
    const { rerender } = render(<SqlEditorPanel status={status({ phase: 'error', error: 'boom' })} onRun={vi.fn()} />)
    expect(screen.queryByTestId('retry-database-button')).not.toBeInTheDocument()

    rerender(<SqlEditorPanel status={status({ phase: 'active' })} onRun={vi.fn()} onRetry={vi.fn()} />)
    expect(screen.queryByTestId('retry-database-button')).not.toBeInTheDocument()
  })

  it('shows a SQL error result without a verdict banner', () => {
    render(
      <SqlEditorPanel status={status({ lastResult: { kind: 'error', message: 'syntax error' } })} onRun={vi.fn()} />,
    )
    expect(screen.getByText(`${he.sqlErrorPrefix}syntax error`)).toBeInTheDocument()
    expect(screen.queryByText(he.pass)).not.toBeInTheDocument()
    expect(screen.queryByText(he.fail)).not.toBeInTheDocument()
  })

  it('shows a passing verdict and the result table', () => {
    const verdict = {
      pass: true,
      missing: [],
      extra: [],
      orderWrong: false,
      expected: [],
      actual: [{ id: 1, name: 'Iris Vell' }],
    }
    render(<SqlEditorPanel status={status({ lastResult: { kind: 'verdict', verdict } })} onRun={vi.fn()} />)

    expect(screen.getByText(he.pass)).toBeInTheDocument()
    expect(screen.getByText('Iris Vell')).toBeInTheDocument()
  })

  it('shows a failing verdict', () => {
    const verdict = { pass: false, missing: [{ id: 2 }], extra: [], orderWrong: false, expected: [], actual: [] }
    render(<SqlEditorPanel status={status({ lastResult: { kind: 'verdict', verdict } })} onRun={vi.fn()} />)

    expect(screen.getByText(he.fail)).toBeInTheDocument()
  })

  // Playtest fix pass (issue 5) — a generic, non-spoiler syntax example.
  // First Mission UX pass — now Easy-only (difficultyLevel 1); see the
  // difficulty describe block below for Medium/Hard/omitted.
  it('shows the generic syntax example hint at Easy difficulty, distinct from the mission\'s own reference query', () => {
    render(<SqlEditorPanel status={status()} onRun={vi.fn()} difficultyLevel={1} />)
    const hint = screen.getByTestId('sql-example-hint')
    expect(hint).toHaveTextContent(he.sqlExampleHint)
    expect(hint).not.toHaveTextContent(mission.referenceSql)
  })

  describe('First Mission UX pass — difficulty-gated example visibility', () => {
    it('hides the example hint at Medium difficulty', () => {
      render(<SqlEditorPanel status={status()} onRun={vi.fn()} difficultyLevel={2} />)
      expect(screen.queryByTestId('sql-example-hint')).not.toBeInTheDocument()
    })

    it('hides the example hint at Hard difficulty', () => {
      render(<SqlEditorPanel status={status()} onRun={vi.fn()} difficultyLevel={3} />)
      expect(screen.queryByTestId('sql-example-hint')).not.toBeInTheDocument()
    })

    it('hides the example hint when no difficultyLevel is given (every existing caller predating this prop)', () => {
      render(<SqlEditorPanel status={status()} onRun={vi.fn()} />)
      expect(screen.queryByTestId('sql-example-hint')).not.toBeInTheDocument()
    })
  })
})
