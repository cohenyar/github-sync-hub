// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { he } from '../i18n'
import type { MissionConfig } from '../missions/types'
import { MissionSelect, type MissionSelectOption } from './MissionSelect'

function mission(id: string, title: string): MissionConfig {
  return {
    id,
    title,
    goal: 'goal',
    prompt: 'prompt',
    subjectHe: 'מתמטיקה',
    taskHe: 'שאלה לדוגמה?',
    answerConfig: { type: 'exact_text', acceptedAnswers: ['תשובה'] },
  }
}

const options: MissionSelectOption[] = [
  { mission: mission('a', 'Mission A'), status: 'completed' },
  { mission: mission('b', 'Mission B'), status: 'available' },
  { mission: mission('c', 'Mission C'), status: 'locked' },
]

describe('MissionSelect', () => {
  it('renders every option with its title and status', () => {
    render(<MissionSelect options={options} activeMissionId="b" onSelect={() => {}} />)

    expect(screen.getByRole('button', { name: `Mission A (${he.completed})` })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `Mission B (${he.available})` })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `Mission C (${he.locked})` })).toBeInTheDocument()
  })

  it('disables a locked mission', () => {
    render(<MissionSelect options={options} activeMissionId="b" onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: `Mission C (${he.locked})` })).toBeDisabled()
  })

  it('disables the currently active mission (nothing to switch to)', () => {
    render(<MissionSelect options={options} activeMissionId="b" onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: `Mission B (${he.available})` })).toBeDisabled()
  })

  it('leaves a completed, non-active mission selectable (so it can be revisited)', () => {
    render(<MissionSelect options={options} activeMissionId="b" onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: `Mission A (${he.completed})` })).toBeEnabled()
  })

  it('calls onSelect with the mission id when an available option is clicked', () => {
    const onSelect = vi.fn()
    render(<MissionSelect options={options} activeMissionId="b" onSelect={onSelect} />)

    fireEvent.click(screen.getByRole('button', { name: `Mission A (${he.completed})` }))

    expect(onSelect).toHaveBeenCalledWith('a')
  })
})
