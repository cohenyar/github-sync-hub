// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { NpcConfig } from '../../npcs'
import type { NpcDialogueContext } from '../logic/npcDialogueState'
import { NpcDialogue } from './NpcDialogue'

const devrin: NpcConfig = {
  id: 'north-warden',
  name: 'Devrin Kass',
  districtId: 'north',
  role: 'District Warden',
  description: "Keeps watch over North district's loyalty to Meridian.",
}

const mera: NpcConfig = {
  id: 'archivist-mera',
  name: 'Mera Solt',
  districtId: 'core',
  role: 'Archivist',
  description: 'Tends the Records Core, waiting for its signal to steady.',
}

function context(overrides: Partial<NpcDialogueContext> = {}): NpcDialogueContext {
  return {
    missionContentStatusByMissionId: { 'first-contact': 'available' },
    activeMissionId: 'first-contact',
    hasAttemptedActiveMission: false,
    districtStatusByDistrictId: { core: 'unstable' },
    ...overrides,
  }
}

describe('NpcDialogue', () => {
  it("renders the NPC's name and a Hebrew greeting", () => {
    render(<NpcDialogue npc={mera} context={context()} onClose={vi.fn()} />)

    expect(screen.getByText('Mera Solt')).toBeInTheDocument()
    expect(screen.queryByTestId('npc-dialogue-mission-context')).not.toBeInTheDocument()
  })

  it('shows a mission-context line when the linked mission is available and unattempted', () => {
    render(<NpcDialogue npc={devrin} context={context()} onClose={vi.fn()} />)

    expect(screen.getByTestId('npc-dialogue-mission-context')).toBeInTheDocument()
  })

  it('drops the mission-context line and changes the greeting once the mission is completed', () => {
    render(
      <NpcDialogue
        npc={devrin}
        context={context({ missionContentStatusByMissionId: { 'first-contact': 'completed' } })}
        onClose={vi.fn()}
      />,
    )

    expect(screen.queryByTestId('npc-dialogue-mission-context')).not.toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(<NpcDialogue npc={devrin} context={context()} onClose={onClose} />)

    fireEvent.click(screen.getByTestId('npc-dialogue-close-button'))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('exposes the NPC id as a data attribute for stable selection', () => {
    render(<NpcDialogue npc={devrin} context={context()} onClose={vi.fn()} />)
    expect(screen.getByTestId('npc-dialogue')).toHaveAttribute('data-npc-id', 'north-warden')
  })

  it('calls onOpen exactly once when the dialogue mounts', () => {
    const onOpen = vi.fn()
    const { rerender } = render(<NpcDialogue npc={devrin} context={context()} onOpen={onOpen} onClose={vi.fn()} />)
    expect(onOpen).toHaveBeenCalledTimes(1)

    rerender(<NpcDialogue npc={devrin} context={context({ activeMissionId: 'district-ties' })} onOpen={onOpen} onClose={vi.fn()} />)
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('renders fine without an onOpen callback', () => {
    expect(() => render(<NpcDialogue npc={devrin} context={context()} onClose={vi.fn()} />)).not.toThrow()
  })
})
