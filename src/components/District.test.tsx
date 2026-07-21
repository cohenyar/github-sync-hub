// @vitest-environment jsdom
import { fireEvent, render, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { he } from '../i18n'
import { getNpcsByDistrict } from '../npcs'
import { District } from './District'

describe('District', () => {
  it('renders the district id as its label', () => {
    const { getByText } = render(<District district={{ id: 'alpha', stats: {} }} />)
    expect(getByText('alpha')).toBeInTheDocument()
  })

  it('exposes the district id as a data attribute', () => {
    const { getByText } = render(<District district={{ id: 'alpha', stats: {} }} />)
    expect(getByText('alpha').closest('[data-district-id]')).toHaveAttribute('data-district-id', 'alpha')
  })

  it('renders identical output for identical district state (pure)', () => {
    const district = { id: 'alpha', stats: { x: 10 } }
    const a = render(<District district={district} />)
    const b = render(<District district={district} />)
    expect(a.container.innerHTML).toBe(b.container.innerHTML)
  })

  it('reflects a higher stat average as higher opacity', () => {
    const low = render(<District district={{ id: 'low', stats: { x: 0 } }} />)
    const high = render(<District district={{ id: 'high', stats: { x: 100 } }} />)

    const lowEl = within(low.container).getByText('low').closest('div') as HTMLElement
    const highEl = within(high.container).getByText('high').closest('div') as HTMLElement

    expect(parseFloat(highEl.style.opacity)).toBeGreaterThan(parseFloat(lowEl.style.opacity))
  })

  it('renders a status label derived from the district status mechanic', () => {
    const { getByText } = render(<District district={{ id: 'alpha', stats: { loyalty: 75, stability: 75 } }} />)
    expect(getByText(he.districtThriving)).toBeInTheDocument()
  })

  it('updates the status label as the district stats change', () => {
    const unstable = render(<District district={{ id: 'a', stats: { loyalty: 10 } }} />)
    expect(within(unstable.container).getByText(he.districtUnstable)).toBeInTheDocument()

    const stable = render(<District district={{ id: 'b', stats: { loyalty: 50 } }} />)
    expect(within(stable.container).getByText(he.districtStable)).toBeInTheDocument()
  })

  it('renders a marker for every unlocked NPC assigned to this district', () => {
    const npcs = getNpcsByDistrict('north')
    expect(npcs.length).toBeGreaterThan(0)

    const { container } = render(
      <District
        district={{ id: 'north', stats: { loyalty: 60, stability: 60 } }}
        unlockedNpcIds={npcs.map((npc) => npc.id)}
      />,
    )

    for (const npc of npcs) {
      const marker = container.querySelector(`[data-npc-id="${npc.id}"]`)
      expect(marker).not.toBeNull()
      expect(marker).toHaveTextContent(npc.name)
    }
  })

  it('renders no NPC list for a district with no assigned NPCs', () => {
    expect(getNpcsByDistrict('alpha')).toEqual([])

    const { container } = render(<District district={{ id: 'alpha', stats: {} }} />)
    expect(container.querySelector('[data-npc-id]')).toBeNull()
  })

  it('hides an NPC that belongs to the district but is not unlocked', () => {
    const npcs = getNpcsByDistrict('east')
    expect(npcs.length).toBeGreaterThan(0)

    const { container } = render(
      <District district={{ id: 'east', stats: { loyalty: 75, stability: 75 } }} unlockedNpcIds={[]} />,
    )

    expect(container.querySelector('[data-npc-id]')).toBeNull()
  })

  it('defaults to no unlocked NPCs when unlockedNpcIds is omitted', () => {
    const npcs = getNpcsByDistrict('east')
    expect(npcs.length).toBeGreaterThan(0)

    const { container } = render(<District district={{ id: 'east', stats: { loyalty: 75, stability: 75 } }} />)

    expect(container.querySelector('[data-npc-id]')).toBeNull()
  })

  it('calls onSelectNpc with the clicked NPC id', () => {
    const npcs = getNpcsByDistrict('north')
    const onSelectNpc = vi.fn()

    const { container } = render(
      <District
        district={{ id: 'north', stats: { loyalty: 60, stability: 60 } }}
        unlockedNpcIds={npcs.map((npc) => npc.id)}
        onSelectNpc={onSelectNpc}
      />,
    )

    const marker = container.querySelector(`[data-npc-id="${npcs[0].id}"]`) as HTMLElement
    fireEvent.click(marker)

    expect(onSelectNpc).toHaveBeenCalledWith(npcs[0].id)
  })

  it("uses the NPC's Hebrew role in the marker tooltip when roleHe is present on the real registry data", () => {
    const npc = getNpcsByDistrict('south').find((candidate) => candidate.id === 'south-engineer')
    expect(npc?.roleHe).toBe('מהנדסת מים')

    const { container } = render(
      <District district={{ id: 'south', stats: { loyalty: 60, stability: 60 } }} unlockedNpcIds={['south-engineer']} />,
    )

    const marker = container.querySelector('[data-npc-id="south-engineer"]')
    expect(marker).toHaveAttribute('title', 'Elin Voss — מהנדסת מים')
  })

  it('does not throw when a marker is clicked and onSelectNpc is omitted', () => {
    const npcs = getNpcsByDistrict('north')

    const { container } = render(
      <District
        district={{ id: 'north', stats: { loyalty: 60, stability: 60 } }}
        unlockedNpcIds={npcs.map((npc) => npc.id)}
      />,
    )

    const marker = container.querySelector(`[data-npc-id="${npcs[0].id}"]`) as HTMLElement
    expect(() => fireEvent.click(marker)).not.toThrow()
  })
})
