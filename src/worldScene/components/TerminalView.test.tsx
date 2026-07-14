// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CampaignSummary } from '../../campaign/types'
import type { MissionStatus } from '../../missions/missionManager'
import type { MissionConfig } from '../../missions/types'
import { TerminalView, type TerminalViewProps } from './TerminalView'

const mission: MissionConfig = {
  id: 'first-contact',
  title: 'First Contact',
  goal: 'Bring the Records Core online.',
  prompt: 'Query the citizens registry.',
  setupSql: '',
  referenceSql: 'SELECT * FROM citizens',
}

const status: MissionStatus = { phase: 'active', mission, lastResult: null, error: null }

const campaignSummary: CampaignSummary = {
  totalMissions: 6,
  completedMissions: 0,
  currentMissionIndex: 1,
  isComplete: false,
}

function baseProps(overrides: Partial<TerminalViewProps> = {}): TerminalViewProps {
  return {
    mission,
    status,
    onRun: vi.fn(),
    campaignSummary,
    completionPercentage: 0,
    contentStatus: 'available',
    coreStatus: 'unstable',
    destinationName: 'מוקד הרשומות',
    destinationProgress: { completed: 0, total: 1 },
    onContinue: vi.fn(),
    onReturnToWorld: vi.fn(),
    ...overrides,
  }
}

describe('TerminalView', () => {
  it('reuses the existing MissionPanel and SqlEditorPanel unchanged', () => {
    render(<TerminalView {...baseProps()} />)

    expect(screen.getByTestId('mission-panel')).toBeInTheDocument()
    expect(screen.getByTestId('sql-input')).toBeInTheDocument()
    expect(screen.getByTestId('run-button')).toBeInTheDocument()
  })

  it('calls onReturnToWorld when the return button is clicked', () => {
    const onReturnToWorld = vi.fn()
    render(<TerminalView {...baseProps({ onReturnToWorld })} />)

    fireEvent.click(screen.getByTestId('return-to-world-button'))
    expect(onReturnToWorld).toHaveBeenCalledTimes(1)
  })

  it('calls onRun with the typed SQL when Run is clicked', () => {
    const onRun = vi.fn()
    render(<TerminalView {...baseProps({ onRun })} />)

    fireEvent.change(screen.getByTestId('sql-input'), { target: { value: 'SELECT * FROM citizens' } })
    fireEvent.click(screen.getByTestId('run-button'))

    expect(onRun).toHaveBeenCalledWith('SELECT * FROM citizens')
  })

  it('shows the Core\'s current status as a labeled pill in the header', () => {
    render(<TerminalView {...baseProps({ coreStatus: 'thriving' })} />)

    expect(screen.getByTestId('terminal-core-status')).toHaveAttribute('data-status', 'thriving')
    expect(screen.getByTestId('terminal-core-status').textContent!.length).toBeGreaterThan(0)
  })

  it('updates the status pill when coreStatus changes while the view stays open', () => {
    const { rerender } = render(<TerminalView {...baseProps({ coreStatus: 'unstable' })} />)
    const before = screen.getByTestId('terminal-core-status').textContent

    rerender(<TerminalView {...baseProps({ coreStatus: 'thriving' })} />)

    expect(screen.getByTestId('terminal-core-status')).toHaveAttribute('data-status', 'thriving')
    expect(screen.getByTestId('terminal-core-status').textContent).not.toBe(before)
  })

  it('names the current destination/course and shows its derived progress', () => {
    render(
      <TerminalView
        {...baseProps({ destinationName: 'רובע הסוחרים', destinationProgress: { completed: 1, total: 3 } })}
      />,
    )

    const label = screen.getByTestId('terminal-destination-label')
    expect(label).toHaveTextContent('רובע הסוחרים')
    expect(label).toHaveTextContent('1/3')
  })

  it('updates the destination label when the player enters a different destination between visits', () => {
    const { rerender } = render(
      <TerminalView {...baseProps({ destinationName: 'מסלול הצפון', destinationProgress: { completed: 0, total: 1 } })} />,
    )
    expect(screen.getByTestId('terminal-destination-label')).toHaveTextContent('מסלול הצפון')

    rerender(
      <TerminalView {...baseProps({ destinationName: 'רובע היציבות', destinationProgress: { completed: 1, total: 1 } })} />,
    )
    expect(screen.getByTestId('terminal-destination-label')).toHaveTextContent('רובע היציבות')
    expect(screen.getByTestId('terminal-destination-label')).toHaveTextContent('1/1')
  })
})

describe('TerminalView — completion beat', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function renderWithPhase(phase: MissionStatus['phase']) {
    const activeStatus: MissionStatus = { phase, mission, lastResult: null, error: null }
    return render(<TerminalView {...baseProps({ status: activeStatus })} />)
  }

  function rerenderWithPhase(rerender: (ui: ReactElement) => void, phase: MissionStatus['phase']) {
    const nextStatus: MissionStatus = { phase, mission, lastResult: null, error: null }
    rerender(<TerminalView {...baseProps({ status: nextStatus, coreStatus: 'thriving' })} />)
  }

  it('does not celebrate on initial render, even when already completed (a plain revisit)', () => {
    renderWithPhase('completed')
    expect(screen.getByTestId('terminal-view')).toHaveAttribute('data-celebrating', 'false')
  })

  it('celebrates the instant phase transitions from active to completed', () => {
    const { rerender } = renderWithPhase('active')
    rerenderWithPhase(rerender, 'completed')

    expect(screen.getByTestId('terminal-view')).toHaveAttribute('data-celebrating', 'true')
  })

  it('stops celebrating once the beat duration elapses', () => {
    const { rerender } = renderWithPhase('active')
    rerenderWithPhase(rerender, 'completed')
    expect(screen.getByTestId('terminal-view')).toHaveAttribute('data-celebrating', 'true')

    act(() => {
      vi.advanceTimersByTime(1200)
    })
    expect(screen.getByTestId('terminal-view')).toHaveAttribute('data-celebrating', 'false')
  })

  it('highlights the return-to-world button for the same duration as the beat', () => {
    const { rerender } = renderWithPhase('active')
    rerenderWithPhase(rerender, 'completed')

    expect(screen.getByTestId('return-to-world-button').className).toMatch(/celebrating/)

    act(() => {
      vi.advanceTimersByTime(1200)
    })
    expect(screen.getByTestId('return-to-world-button').className).not.toMatch(/celebrating/)
  })
})
