// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { QuestChip } from './QuestChip'

describe('QuestChip', () => {
  it('always shows the mission title', () => {
    render(<QuestChip title="מגע ראשון" />)
    expect(screen.getByTestId('quest-chip')).toHaveTextContent('מגע ראשון')
  })

  it('shows no progress readout and no goal line when neither is provided', () => {
    render(<QuestChip title="מגע ראשון" />)
    expect(screen.queryByTestId('quest-chip-progress')).not.toBeInTheDocument()
    expect(screen.queryByTestId('quest-chip-goal')).not.toBeInTheDocument()
  })

  it('shows the mission progress fraction when both index and total are provided', () => {
    render(<QuestChip title="מגע ראשון" currentMissionIndex={1} totalMissions={6} />)
    expect(screen.getByTestId('quest-chip-progress')).toHaveTextContent('1')
    expect(screen.getByTestId('quest-chip-progress')).toHaveTextContent('6')
  })

  // Playtest fix pass (issue 2) — the chip previously showed only a title,
  // giving the player a name but no actionable next step.
  it('shows the mission goal as a concrete next step, distinct from the title', () => {
    render(<QuestChip title="מגע ראשון" goal="גש/י לליבת האיתור והפעל/י אותה." />)
    const goal = screen.getByTestId('quest-chip-goal')
    expect(goal).toHaveTextContent('גש/י לליבת האיתור והפעל/י אותה.')
    expect(screen.getByTestId('quest-chip')).toHaveTextContent('מגע ראשון')
  })
})
