// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { CampaignSummary } from '../campaign/types'
import { he } from '../i18n'
import type { MissionConfig } from '../missions/types'
import { MissionPanel } from './MissionPanel'

const mission: MissionConfig = {
  id: 'test-mission',
  title: 'First Contact',
  goal: 'Bring the Records Core online.',
  prompt: 'Query the citizens registry.',
  subjectHe: 'היסטוריה',
  taskHe: 'שאלה לדוגמה?',
  answerConfig: { type: 'exact_text', acceptedAnswers: ['תשובה'] },
}

const nextMission: MissionConfig = {
  id: 'second-mission',
  title: 'Second Mission',
  goal: 'goal',
  prompt: 'prompt',
  subjectHe: 'היסטוריה',
  taskHe: 'שאלה לדוגמה 2?',
  answerConfig: { type: 'exact_text', acceptedAnswers: ['תשובה'] },
}

function summary(overrides: Partial<CampaignSummary> = {}): CampaignSummary {
  return { totalMissions: 1, completedMissions: 0, currentMissionIndex: 1, isComplete: false, ...overrides }
}

describe('MissionPanel', () => {
  it('renders the mission title and goal (labeled as the objective) immediately, ahead of everything else', () => {
    render(<MissionPanel mission={mission} />)
    expect(screen.getByText('First Contact')).toBeInTheDocument()
    expect(screen.getByTestId('mission-goal')).toHaveTextContent('Bring the Records Core online.')
    expect(screen.getByTestId('mission-goal')).toHaveTextContent(he.missionGoalLabel.trim())
  })

  it('renders the full prompt/narrative inside the collapsed secondary details, not above the fold', () => {
    render(<MissionPanel mission={mission} />)
    expect(screen.getByText('Query the citizens registry.')).toBeInTheDocument()
    expect(screen.getByTestId('mission-secondary-details')).toContainElement(
      screen.getByText('Query the citizens registry.'),
    )
  })

  it('renders no instruction line when the mission has none authored', () => {
    render(<MissionPanel mission={mission} />)
    expect(screen.queryByTestId('mission-instruction')).not.toBeInTheDocument()
  })

  it('renders the instruction line when the mission has one authored, ahead of the secondary details', () => {
    const withInstruction: MissionConfig = { ...mission, instructionHe: 'ענו על השאלה שלמעלה.' }
    render(<MissionPanel mission={withInstruction} />)
    const instruction = screen.getByTestId('mission-instruction')
    expect(instruction).toHaveTextContent('ענו על השאלה שלמעלה.')
    expect(screen.queryByTestId('mission-secondary-details')).not.toContainElement(instruction)
  })

  describe('First Mission UX pass — inline hint (Easy only)', () => {
    const withHint: MissionConfig = { ...mission, hintHe: 'רמז: חשבו על התשובה הנפוצה ביותר.' }

    it('shows no inline hint when difficultyLevel is omitted (every existing caller/test)', () => {
      render(<MissionPanel mission={withHint} />)
      expect(screen.queryByTestId('mission-inline-hint')).not.toBeInTheDocument()
    })

    it('shows no inline hint at Medium or Hard', () => {
      render(<MissionPanel mission={withHint} difficultyLevel={2} />)
      expect(screen.queryByTestId('mission-inline-hint')).not.toBeInTheDocument()
      const { unmount } = render(<MissionPanel mission={withHint} difficultyLevel={3} />)
      expect(screen.queryAllByTestId('mission-inline-hint')).toHaveLength(0)
      unmount()
    })

    it('shows the mission\'s own hint inline at Easy', () => {
      render(<MissionPanel mission={withHint} difficultyLevel={1} />)
      expect(screen.getByTestId('mission-inline-hint')).toHaveTextContent('רמז: חשבו על התשובה הנפוצה ביותר.')
    })

    it('shows no inline hint at Easy when the mission has no hint authored', () => {
      render(<MissionPanel mission={mission} difficultyLevel={1} />)
      expect(screen.queryByTestId('mission-inline-hint')).not.toBeInTheDocument()
    })
  })

  it('renders no status line when no phase is given', () => {
    render(<MissionPanel mission={mission} />)
    expect(screen.queryByText(new RegExp(`^${he.statusLabelPrefix}`))).not.toBeInTheDocument()
  })

  it.each([
    ['active', `${he.statusLabelPrefix}${he.phaseActive}`],
    ['completed', `${he.statusLabelPrefix}${he.completed}`],
  ] as const)('renders "%s" phase as "%s"', (phase, expected) => {
    render(<MissionPanel mission={mission} phase={phase} />)
    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it('renders no "Mission X of Y" line when no campaign summary is given', () => {
    render(<MissionPanel mission={mission} />)
    expect(
      screen.queryByText(new RegExp(`^${he.missionLabel} \\d+ ${he.ofLabel} \\d+$`)),
    ).not.toBeInTheDocument()
  })

  it('renders "Mission X of Y" from the active mission\'s own order, not the campaign\'s furthest-incomplete pointer', () => {
    render(
      <MissionPanel
        mission={mission}
        campaignSummary={summary({ totalMissions: 3, currentMissionIndex: 3 })}
        activeMissionOrder={2}
      />,
    )
    expect(screen.getByText(`${he.missionLabel} 2 ${he.ofLabel} 3`)).toBeInTheDocument()
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
    const bar = screen.getByRole('progressbar', { name: he.campaignProgressLabel })
    expect(bar).toHaveAttribute('aria-valuenow', '2')
    expect(bar).toHaveAttribute('aria-valuemax', '4')
    expect(bar.children).toHaveLength(4)
  })

  it('renders no "Next" line when there is no next mission', () => {
    render(<MissionPanel mission={mission} campaignSummary={summary()} />)
    expect(screen.queryByText(new RegExp(`^${he.nextLabelPrefix}`))).not.toBeInTheDocument()
  })

  it('renders the next mission title when one is given', () => {
    render(<MissionPanel mission={mission} campaignSummary={summary({ totalMissions: 2 })} nextMission={nextMission} />)
    expect(screen.getByText(`${he.nextLabelPrefix}Second Mission`)).toBeInTheDocument()
  })

  it('renders no progress line when no completion percentage is given', () => {
    render(<MissionPanel mission={mission} />)
    expect(screen.queryByText(new RegExp(`^${he.progressLabelPrefix}`))).not.toBeInTheDocument()
  })

  it('renders the completion percentage, including zero', () => {
    render(<MissionPanel mission={mission} completionPercentage={0} />)
    expect(screen.getByText(`${he.progressLabelPrefix}0%`)).toBeInTheDocument()
  })

  it('renders no content status line when none is given', () => {
    render(<MissionPanel mission={mission} />)
    expect(screen.queryByText(new RegExp(`^${he.contentLabelPrefix}`))).not.toBeInTheDocument()
  })

  it.each([
    ['locked', `${he.contentLabelPrefix}${he.locked}`],
    ['available', `${he.contentLabelPrefix}${he.available}`],
    ['completed', `${he.contentLabelPrefix}${he.completed}`],
  ] as const)('renders content status "%s" as "%s"', (contentStatus, expected) => {
    render(<MissionPanel mission={mission} contentStatus={contentStatus} />)
    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it('renders the next mission title without a status when none is given', () => {
    render(<MissionPanel mission={mission} nextMission={nextMission} />)
    expect(screen.getByText(`${he.nextLabelPrefix}Second Mission`)).toBeInTheDocument()
  })

  it('renders the next mission alongside its lock status', () => {
    render(<MissionPanel mission={mission} nextMission={nextMission} nextMissionContentStatus="locked" />)
    expect(screen.getByText(`${he.nextLabelPrefix}Second Mission (${he.locked})`)).toBeInTheDocument()
  })

  it('updates the next mission status from Locked to Available', () => {
    const { rerender } = render(
      <MissionPanel mission={mission} nextMission={nextMission} nextMissionContentStatus="locked" />,
    )
    expect(screen.getByText(`${he.nextLabelPrefix}Second Mission (${he.locked})`)).toBeInTheDocument()

    rerender(<MissionPanel mission={mission} nextMission={nextMission} nextMissionContentStatus="available" />)
    expect(screen.getByText(`${he.nextLabelPrefix}Second Mission (${he.available})`)).toBeInTheDocument()
  })

  describe('Continue to Next Mission', () => {
    it('does not render without onContinue', () => {
      render(
        <MissionPanel mission={mission} phase="completed" nextMission={nextMission} nextMissionContentStatus="available" />,
      )
      expect(screen.queryByRole('button', { name: new RegExp(`^${he.continueToPrefix}`) })).not.toBeInTheDocument()
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
      expect(screen.queryByRole('button', { name: new RegExp(`^${he.continueToPrefix}`) })).not.toBeInTheDocument()
    })

    it('does not render when there is no next mission', () => {
      render(<MissionPanel mission={mission} phase="completed" onContinue={vi.fn()} />)
      expect(screen.queryByRole('button', { name: new RegExp(`^${he.continueToPrefix}`) })).not.toBeInTheDocument()
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
      expect(screen.queryByRole('button', { name: new RegExp(`^${he.continueToPrefix}`) })).not.toBeInTheDocument()
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

      const button = screen.getByRole('button', { name: `${he.continueToPrefix}Second Mission` })
      fireEvent.click(button)
      expect(onContinue).toHaveBeenCalledTimes(1)
    })
  })
})
