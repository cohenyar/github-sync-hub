// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { CampaignSummary } from '../campaign/types'
import type { MissionConfig } from '../missions/types'
import { MissionPanel } from './MissionPanel'

const mission: MissionConfig = {
  id: 'test-mission',
  title: 'First Contact',
  goal: 'Bring the Records Core online.',
  prompt: 'Query the citizens registry.',
  setupSql: '',
  referenceSql: 'SELECT 1',
}

const nextMission: MissionConfig = {
  id: 'second-mission',
  title: 'Second Mission',
  goal: 'goal',
  prompt: 'prompt',
  setupSql: '',
  referenceSql: 'SELECT 2',
}

function summary(overrides: Partial<CampaignSummary> = {}): CampaignSummary {
  return { totalMissions: 1, completedMissions: 0, currentMissionIndex: 1, isComplete: false, ...overrides }
}

describe('MissionPanel', () => {
  it('renders the mission title, goal, and prompt', () => {
    render(<MissionPanel mission={mission} />)
    expect(screen.getByText('First Contact')).toBeInTheDocument()
    expect(screen.getByText('Bring the Records Core online.')).toBeInTheDocument()
    expect(screen.getByText('Query the citizens registry.')).toBeInTheDocument()
  })

  it('renders no status line when no phase is given', () => {
    render(<MissionPanel mission={mission} />)
    expect(screen.queryByText(/^Status:/)).not.toBeInTheDocument()
  })

  it.each([
    ['loading', 'Status: Preparing…'],
    ['active', 'Status: In Progress'],
    ['completed', 'Status: Completed'],
    ['error', 'Status: Error'],
  ] as const)('renders "%s" phase as "%s"', (phase, expected) => {
    render(<MissionPanel mission={mission} phase={phase} />)
    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it('renders no "Mission X of Y" line when no campaign summary is given', () => {
    render(<MissionPanel mission={mission} />)
    expect(screen.queryByText(/^Mission \d+ of \d+$/)).not.toBeInTheDocument()
  })

  it('renders "Mission X of Y" from the campaign summary', () => {
    render(<MissionPanel mission={mission} campaignSummary={summary({ totalMissions: 3, currentMissionIndex: 2 })} />)
    expect(screen.getByText('Mission 2 of 3')).toBeInTheDocument()
  })

  it('renders no progress stepper when no campaign summary is given', () => {
    render(<MissionPanel mission={mission} />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('renders a progress stepper with one segment per mission, filled by completion count', () => {
    render(
      <MissionPanel
        mission={mission}
        campaignSummary={summary({ totalMissions: 4, completedMissions: 2, currentMissionIndex: 3 })}
      />,
    )
    const bar = screen.getByRole('progressbar', { name: 'Campaign progress' })
    expect(bar).toHaveAttribute('aria-valuenow', '2')
    expect(bar).toHaveAttribute('aria-valuemax', '4')
    expect(bar.children).toHaveLength(4)
  })

  it('renders no "Next" line when there is no next mission', () => {
    render(<MissionPanel mission={mission} campaignSummary={summary()} />)
    expect(screen.queryByText(/^Next:/)).not.toBeInTheDocument()
  })

  it('renders the next mission title when one is given', () => {
    render(<MissionPanel mission={mission} campaignSummary={summary({ totalMissions: 2 })} nextMission={nextMission} />)
    expect(screen.getByText('Next: Second Mission')).toBeInTheDocument()
  })

  it('renders no progress line when no completion percentage is given', () => {
    render(<MissionPanel mission={mission} />)
    expect(screen.queryByText(/^Progress:/)).not.toBeInTheDocument()
  })

  it('renders the completion percentage, including zero', () => {
    render(<MissionPanel mission={mission} completionPercentage={0} />)
    expect(screen.getByText('Progress: 0%')).toBeInTheDocument()
  })

  it('renders no content status line when none is given', () => {
    render(<MissionPanel mission={mission} />)
    expect(screen.queryByText(/^Content:/)).not.toBeInTheDocument()
  })

  it.each([
    ['locked', 'Content: Locked'],
    ['available', 'Content: Available'],
    ['completed', 'Content: Completed'],
  ] as const)('renders content status "%s" as "%s"', (contentStatus, expected) => {
    render(<MissionPanel mission={mission} contentStatus={contentStatus} />)
    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it('renders the next mission title without a status when none is given', () => {
    render(<MissionPanel mission={mission} nextMission={nextMission} />)
    expect(screen.getByText('Next: Second Mission')).toBeInTheDocument()
  })

  it('renders the next mission alongside its lock status', () => {
    render(<MissionPanel mission={mission} nextMission={nextMission} nextMissionContentStatus="locked" />)
    expect(screen.getByText('Next: Second Mission (Locked)')).toBeInTheDocument()
  })

  it('updates the next mission status from Locked to Available', () => {
    const { rerender } = render(
      <MissionPanel mission={mission} nextMission={nextMission} nextMissionContentStatus="locked" />,
    )
    expect(screen.getByText('Next: Second Mission (Locked)')).toBeInTheDocument()

    rerender(<MissionPanel mission={mission} nextMission={nextMission} nextMissionContentStatus="available" />)
    expect(screen.getByText('Next: Second Mission (Available)')).toBeInTheDocument()
  })

  describe('Continue to Next Mission', () => {
    it('does not render without onContinue', () => {
      render(
        <MissionPanel mission={mission} phase="completed" nextMission={nextMission} nextMissionContentStatus="available" />,
      )
      expect(screen.queryByRole('button', { name: /Continue to/ })).not.toBeInTheDocument()
    })

    it('does not render when the mission phase is not "completed"', () => {
      render(
        <MissionPanel
          mission={mission}
          phase="active"
          nextMission={nextMission}
          nextMissionContentStatus="available"
          onContinue={vi.fn()}
        />,
      )
      expect(screen.queryByRole('button', { name: /Continue to/ })).not.toBeInTheDocument()
    })

    it('does not render when there is no next mission', () => {
      render(<MissionPanel mission={mission} phase="completed" onContinue={vi.fn()} />)
      expect(screen.queryByRole('button', { name: /Continue to/ })).not.toBeInTheDocument()
    })

    it('does not render when the next mission is locked', () => {
      render(
        <MissionPanel
          mission={mission}
          phase="completed"
          nextMission={nextMission}
          nextMissionContentStatus="locked"
          onContinue={vi.fn()}
        />,
      )
      expect(screen.queryByRole('button', { name: /Continue to/ })).not.toBeInTheDocument()
    })

    it('renders and calls onContinue when the mission is completed and the next one is available', () => {
      const onContinue = vi.fn()
      render(
        <MissionPanel
          mission={mission}
          phase="completed"
          nextMission={nextMission}
          nextMissionContentStatus="available"
          onContinue={onContinue}
        />,
      )

      const button = screen.getByRole('button', { name: 'Continue to Second Mission' })
      fireEvent.click(button)
      expect(onContinue).toHaveBeenCalledTimes(1)
    })
  })
})
