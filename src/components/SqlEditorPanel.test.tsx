// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
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
    expect(screen.getByRole('button', { name: 'Run' })).toBeDisabled()
  })

  it('enables Run once the mission is active', () => {
    render(<SqlEditorPanel status={status({ phase: 'active' })} onRun={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Run' })).toBeEnabled()
  })

  it('keeps Run enabled once the mission is completed', () => {
    render(<SqlEditorPanel status={status({ phase: 'completed' })} onRun={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Run' })).toBeEnabled()
  })

  it('disables Run when the database failed to prepare', () => {
    render(<SqlEditorPanel status={status({ phase: 'error', error: 'boom' })} onRun={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Run' })).toBeDisabled()
  })

  it('calls onRun with the current textarea contents', () => {
    const onRun = vi.fn()
    render(<SqlEditorPanel status={status()} onRun={onRun} />)

    fireEvent.change(screen.getByPlaceholderText('-- write your query here'), {
      target: { value: 'SELECT * FROM citizens' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))

    expect(onRun).toHaveBeenCalledWith('SELECT * FROM citizens')
  })

  it('shows a database preparation error', () => {
    render(<SqlEditorPanel status={status({ phase: 'error', error: 'boom' })} onRun={vi.fn()} />)
    expect(screen.getByText('Failed to prepare database: boom')).toBeInTheDocument()
  })

  it('shows a SQL error result without a verdict banner', () => {
    render(
      <SqlEditorPanel status={status({ lastResult: { kind: 'error', message: 'syntax error' } })} onRun={vi.fn()} />,
    )
    expect(screen.getByText('SQL error: syntax error')).toBeInTheDocument()
    expect(screen.queryByText('Pass')).not.toBeInTheDocument()
    expect(screen.queryByText('Fail')).not.toBeInTheDocument()
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

    expect(screen.getByText('Pass')).toBeInTheDocument()
    expect(screen.getByText('Iris Vell')).toBeInTheDocument()
  })

  it('shows a failing verdict', () => {
    const verdict = { pass: false, missing: [{ id: 2 }], extra: [], orderWrong: false, expected: [], actual: [] }
    render(<SqlEditorPanel status={status({ lastResult: { kind: 'verdict', verdict } })} onRun={vi.fn()} />)

    expect(screen.getByText('Fail')).toBeInTheDocument()
  })
})
