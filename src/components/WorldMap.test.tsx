// @vitest-environment jsdom
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { getNpcsByDistrict } from '../npcs'
import { createWorldState } from '../worldState/createWorldState'
import { WorldMap } from './WorldMap'

describe('WorldMap', () => {
  it('renders one District per district in the world state', () => {
    const world = createWorldState([
      { id: 'a', stats: {} },
      { id: 'b', stats: {} },
    ])
    const { getByText } = render(<WorldMap world={world} />)
    expect(getByText('a')).toBeInTheDocument()
    expect(getByText('b')).toBeInTheDocument()
  })

  it('renders no districts for an empty world', () => {
    const world = createWorldState([])
    const { container } = render(<WorldMap world={world} />)
    expect(container.querySelectorAll('[data-district-id]')).toHaveLength(0)
  })

  it('exposes the current turn as a data attribute', () => {
    const world = { ...createWorldState([]), turn: 3 }
    const { container } = render(<WorldMap world={world} />)
    expect(container.firstElementChild).toHaveAttribute('data-turn', '3')
  })

  it('is a pure function of world state: identical input renders identical output', () => {
    const world = createWorldState([{ id: 'a', stats: { x: 5 } }])
    const first = render(<WorldMap world={world} />)
    const second = render(<WorldMap world={world} />)
    expect(first.container.innerHTML).toBe(second.container.innerHTML)
  })

  it('reacts only to world state differences: different stats produce different output', () => {
    const worldA = createWorldState([{ id: 'a', stats: { x: 0 } }])
    const worldB = createWorldState([{ id: 'a', stats: { x: 100 } }])
    const a = render(<WorldMap world={worldA} />)
    const b = render(<WorldMap world={worldB} />)
    expect(a.container.innerHTML).not.toBe(b.container.innerHTML)
  })

  it('passes unlockedNpcIds down so unlocked NPCs render under their district', () => {
    const npcs = getNpcsByDistrict('north')
    expect(npcs.length).toBeGreaterThan(0)

    const world = createWorldState([{ id: 'north', stats: { loyalty: 60, stability: 60 } }])
    const { container } = render(<WorldMap world={world} unlockedNpcIds={npcs.map((npc) => npc.id)} />)

    for (const npc of npcs) {
      expect(container.querySelector(`[data-npc-id="${npc.id}"]`)).not.toBeNull()
    }
  })

  it('defaults to no unlocked NPCs when unlockedNpcIds is omitted', () => {
    const world = createWorldState([{ id: 'north', stats: { loyalty: 60, stability: 60 } }])
    const { container } = render(<WorldMap world={world} />)

    expect(container.querySelector('[data-npc-id]')).toBeNull()
  })

  it('propagates a marker click up to onSelectNpc with the NPC id', () => {
    const npcs = getNpcsByDistrict('north')
    const onSelectNpc = vi.fn()

    const world = createWorldState([{ id: 'north', stats: { loyalty: 60, stability: 60 } }])
    const { container } = render(
      <WorldMap world={world} unlockedNpcIds={npcs.map((npc) => npc.id)} onSelectNpc={onSelectNpc} />,
    )

    const marker = container.querySelector(`[data-npc-id="${npcs[0].id}"]`) as HTMLElement
    fireEvent.click(marker)

    expect(onSelectNpc).toHaveBeenCalledWith(npcs[0].id)
  })
})
