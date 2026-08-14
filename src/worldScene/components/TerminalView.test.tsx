// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CampaignSummary } from '../../campaign/types'
import type { MissionConfig } from '../../missions/types'
import type { QuestionMissionPhase, QuestionMissionStatus } from '../../missions/useQuestionMission'
import type { NpcConfig } from '../../npcs/types'
import { TerminalView, type TerminalViewProps } from './TerminalView'

const mission: MissionConfig = {
  id: 'first-contact',
  title: 'First Contact',
  goal: 'Bring the Records Core online.',
  prompt: 'The Records Core is blind.\nQuery the citizens registry.',
  subjectHe: 'היסטוריה',
  taskHe: 'מי היה הקיסר הראשון של רומא?',
  answerConfig: { type: 'multiple_choice', options: ['אוגוסטוס', 'נירון'], correctIndex: 0 },
}

const npc: NpcConfig = {
  id: 'archivist-mera',
  name: 'Mera Solt',
  districtId: 'core',
  role: 'Archivist',
  description: 'Tends the Records Core.',
}

const status: QuestionMissionStatus = { phase: 'active', lastResult: null }

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
    onSubmitAnswer: vi.fn(),
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
  it('reuses the existing MissionPanel and QuestionAnswerPanel unchanged, with no SQL console anywhere', () => {
    render(<TerminalView {...baseProps()} />)

    expect(screen.getByTestId('mission-panel')).toBeInTheDocument()
    expect(screen.getByTestId('question-panel')).toBeInTheDocument()
    expect(screen.queryByTestId('sql-input')).not.toBeInTheDocument()
    expect(screen.queryByTestId('run-button')).not.toBeInTheDocument()
  })

  it('calls onReturnToWorld when the return button is clicked', () => {
    const onReturnToWorld = vi.fn()
    render(<TerminalView {...baseProps({ onReturnToWorld })} />)

    fireEvent.click(screen.getByTestId('return-to-world-button'))
    expect(onReturnToWorld).toHaveBeenCalledTimes(1)
  })

  it('calls onSubmitAnswer with the selected option when submitted', () => {
    const onSubmitAnswer = vi.fn()
    render(<TerminalView {...baseProps({ onSubmitAnswer })} />)

    fireEvent.click(screen.getByTestId('question-option-0'))
    fireEvent.click(screen.getByTestId('question-submit-button'))

    expect(onSubmitAnswer).toHaveBeenCalledWith('0')
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

  it('shows the quest title in the Archive intro', () => {
    render(<TerminalView {...baseProps()} />)
    expect(screen.getByTestId('archive-intro-quest-title')).toHaveTextContent('First Contact')
  })

  it('falls back to the mission\'s own opening line as the narrative when no companion NPC applies', () => {
    render(<TerminalView {...baseProps()} />)
    expect(screen.queryByTestId('archive-intro-npc')).not.toBeInTheDocument()
    expect(screen.getByTestId('archive-intro-narrative')).toHaveTextContent('The Records Core is blind.')
  })

  it('shows the companion NPC\'s identity and their own authored line when one is unlocked for this mission', () => {
    render(<TerminalView {...baseProps({ npc, npcMessage: 'Query the registry, and Meridian sees again.' })} />)
    expect(screen.getByTestId('archive-intro-npc')).toHaveTextContent('Mera Solt')
    expect(screen.getByTestId('archive-intro-npc')).toHaveTextContent('Archivist')
    expect(screen.getByTestId('archive-intro-narrative')).toHaveTextContent(
      'Query the registry, and Meridian sees again.',
    )
  })
})

describe('TerminalView — completion beat', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function renderWithPhase(phase: QuestionMissionPhase) {
    const activeStatus: QuestionMissionStatus = { phase, lastResult: null }
    return render(<TerminalView {...baseProps({ status: activeStatus })} />)
  }

  function rerenderWithPhase(rerender: (ui: ReactElement) => void, phase: QuestionMissionPhase) {
    const nextStatus: QuestionMissionStatus = { phase, lastResult: null }
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
