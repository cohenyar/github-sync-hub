// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { MissionConfig } from '../../missions/types'
import type { NpcConfig } from '../../npcs/types'
import { ArchiveIntro } from './ArchiveIntro'

const mission: MissionConfig = {
  id: 'first-contact',
  title: 'First Contact',
  titleHe: 'הקיסר הראשון',
  goal: 'Identify the first Roman emperor.',
  prompt: 'The Records Core is blind.\nQuery the citizens registry.',
  promptHe: 'מוקד הרשומות עיוור.\nשאל את מרשם התושבים.',
  subjectHe: 'היסטוריה',
  taskHe: 'מי היה הקיסר הראשון של רומא?',
  answerConfig: { type: 'multiple_choice', options: ['אוגוסטוס', 'נירון'], correctIndex: 0 },
}

const npc: NpcConfig = {
  id: 'archivist-mera',
  name: 'Mera Solt',
  districtId: 'core',
  role: 'Archivist',
  roleHe: 'ארכיבאית',
  description: 'Tends the Records Core.',
}

describe('ArchiveIntro', () => {
  it('shows the mission\'s Hebrew display title, not the raw English field', () => {
    render(<ArchiveIntro mission={mission} />)
    expect(screen.getByTestId('archive-intro-quest-title')).toHaveTextContent('הקיסר הראשון')
  })

  it('omits the NPC row entirely when no companion applies, rather than rendering an empty one', () => {
    render(<ArchiveIntro mission={mission} />)
    expect(screen.queryByTestId('archive-intro-npc')).not.toBeInTheDocument()
  })

  it('falls back to the first line of the mission\'s own (Hebrew) prompt as the narrative', () => {
    render(<ArchiveIntro mission={mission} />)
    expect(screen.getByTestId('archive-intro-narrative')).toHaveTextContent('מוקד הרשומות עיוור.')
  })

  it('prefers the companion\'s own authored line over the mission\'s fallback narrative', () => {
    render(<ArchiveIntro mission={mission} npc={npc} npcMessage="שלום, אני מרה." />)
    expect(screen.getByTestId('archive-intro-narrative')).toHaveTextContent('שלום, אני מרה.')
    expect(screen.getByTestId('archive-intro-narrative')).not.toHaveTextContent('מוקד הרשומות עיוור.')
  })

  it('shows the NPC\'s name and Hebrew display role when a companion is given', () => {
    render(<ArchiveIntro mission={mission} npc={npc} npcMessage="שלום, אני מרה." />)
    const npcRow = screen.getByTestId('archive-intro-npc')
    expect(npcRow).toHaveTextContent('Mera Solt')
    expect(npcRow).toHaveTextContent('ארכיבאית')
  })

  it('falls back to the mission narrative when npcMessage is given but blank', () => {
    render(<ArchiveIntro mission={mission} npc={npc} npcMessage="   " />)
    expect(screen.getByTestId('archive-intro-narrative')).toHaveTextContent('מוקד הרשומות עיוור.')
  })
})
