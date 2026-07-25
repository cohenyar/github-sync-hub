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

describe('WorldMap — Meridian UI stability pass: stable learning-path layout', () => {
  it('renders the four real districts in the canonical learning-journey order (core, north, south, east), regardless of world-state insertion order', () => {
    // initialDistricts.ts's own insertion order is north/south/east/core —
    // deliberately different here, to prove the map re-orders rather than
    // trusting object key order.
    const world = createWorldState([
      { id: 'north', stats: { loyalty: 60, stability: 60 } },
      { id: 'south', stats: { loyalty: 40, stability: 20 } },
      { id: 'east', stats: { loyalty: 75, stability: 75 } },
      { id: 'core', stats: { signal: 0 } },
    ])

    const { container } = render(<WorldMap world={world} />)
    const ids = Array.from(container.querySelectorAll('[data-district-id]')).map((el) =>
      el.getAttribute('data-district-id'),
    )

    expect(ids).toEqual(['core', 'north', 'south', 'east'])
  })

  it('keeps districts with unrecognized ids in their original relative order, after every known id', () => {
    const world = createWorldState([
      { id: 'zzz-test', stats: {} },
      { id: 'east', stats: { loyalty: 75, stability: 75 } },
      { id: 'aaa-test', stats: {} },
      { id: 'core', stats: { signal: 0 } },
    ])

    const { container } = render(<WorldMap world={world} />)
    const ids = Array.from(container.querySelectorAll('[data-district-id]')).map((el) =>
      el.getAttribute('data-district-id'),
    )

    expect(ids).toEqual(['core', 'east', 'zzz-test', 'aaa-test'])
  })

  it('renders a visible connector between every pair of consecutive districts, and none at the very start', () => {
    const world = createWorldState([
      { id: 'north', stats: { loyalty: 60, stability: 60 } },
      { id: 'south', stats: { loyalty: 40, stability: 20 } },
      { id: 'east', stats: { loyalty: 75, stability: 75 } },
      { id: 'core', stats: { signal: 0 } },
    ])

    const { container } = render(<WorldMap world={world} />)
    // 4 districts -> exactly 3 connectors (one between each consecutive pair).
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(3)
  })

  it('gives the active district and every status a distinguishable data attribute, never overlapping', () => {
    const world = createWorldState([
      { id: 'north', stats: { loyalty: 60, stability: 60 } }, // stable
      { id: 'south', stats: { loyalty: 10, stability: 10 } }, // unstable
      { id: 'east', stats: { loyalty: 90, stability: 90 } }, // thriving
    ])

    const { container } = render(<WorldMap world={world} activeDistrictId="north" />)

    const north = container.querySelector('[data-district-id="north"]')!.closest('[data-status]')
    const south = container.querySelector('[data-district-id="south"]')!.closest('[data-status]')
    const east = container.querySelector('[data-district-id="east"]')!.closest('[data-status]')

    expect(north).toHaveAttribute('data-status', 'stable')
    expect(north).toHaveAttribute('data-active', 'true')
    expect(south).toHaveAttribute('data-status', 'unstable')
    expect(south).not.toHaveAttribute('data-active')
    expect(east).toHaveAttribute('data-status', 'thriving')
    expect(east).not.toHaveAttribute('data-active')

    // Every one of the three states above must be genuinely distinct.
    const statuses = [north, south, east].map((el) => el?.getAttribute('data-status'))
    expect(new Set(statuses).size).toBe(3)
  })

  it('does not position nodes with inline transforms/rotation — the primary layout is plain flex flow, not absolute trigonometry', () => {
    const world = createWorldState([
      { id: 'north', stats: { loyalty: 60, stability: 60 } },
      { id: 'south', stats: { loyalty: 40, stability: 20 } },
    ])

    const { container } = render(<WorldMap world={world} />)

    for (const node of container.querySelectorAll('[data-status]')) {
      const inlineStyle = (node as HTMLElement).getAttribute('style') ?? ''
      expect(inlineStyle).not.toContain('--slot-index')
      expect(inlineStyle).not.toContain('rotate(')
      expect(inlineStyle).not.toContain('position')
    }
  })
})
