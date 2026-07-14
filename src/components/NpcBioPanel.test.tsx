// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { NpcConfig } from '../npcs'
import { NpcBioPanel } from './NpcBioPanel'

const testNpc: NpcConfig = {
  id: 'test-npc',
  name: 'Devrin Kass',
  districtId: 'north',
  role: 'District Warden',
  description: "Keeps watch over North district's loyalty to Meridian.",
}

describe('NpcBioPanel', () => {
  it('renders the NPC name, role, district, and description', () => {
    render(<NpcBioPanel npc={testNpc} onClose={vi.fn()} />)

    expect(screen.getByText('Devrin Kass')).toBeInTheDocument()
    expect(screen.getByText(/District Warden/)).toBeInTheDocument()
    expect(screen.getByText(/north/)).toBeInTheDocument()
    expect(screen.getByText("Keeps watch over North district's loyalty to Meridian.")).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(<NpcBioPanel npc={testNpc} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders identical output for identical props (pure)', () => {
    const a = render(<NpcBioPanel npc={testNpc} onClose={vi.fn()} />)
    const b = render(<NpcBioPanel npc={testNpc} onClose={vi.fn()} />)
    expect(a.container.innerHTML).toBe(b.container.innerHTML)
  })
})
