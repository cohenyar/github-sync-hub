// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { removeNpc } from '../../npcs'
import { getAdminSections } from '../selectors/adminSelectors'
import { AdminPanel } from './AdminPanel'

const TEST_NPC_ID = 'test-admin-panel-npc'

describe('AdminPanel', () => {
  it('renders the Admin Area title', () => {
    render(<AdminPanel />)
    expect(screen.getByRole('region', { name: 'Admin Area' })).toBeInTheDocument()
    expect(screen.getByText('Admin Area')).toBeInTheDocument()
  })

  it('renders every registered admin section with its description, item count, and status', () => {
    render(<AdminPanel />)

    for (const section of getAdminSections()) {
      const card = document.querySelector(`[data-section-id="${section.id}"]`)
      expect(card).not.toBeNull()
      expect(card).toHaveTextContent(section.title)
      expect(card).toHaveTextContent(section.description)
      expect(card).toHaveTextContent(`Items: ${section.itemCount}`)
      expect(card).toHaveTextContent(`Status: ${section.status}`)
    }
  })

  // General educational assistant pass — the Missions section's own CRUD
  // form (MissionsAdminSection) authored only SQL missions and has been
  // removed along with SQL as a learning subject; the real Admin CMS
  // (Course -> Lesson -> Mission/Question) is the sanctioned authoring path
  // now. This section is read-only here — no id/title/goal form renders for
  // it — while the still-CRUD-enabled NPCs section proves the underlying
  // "item count updates live after a mutation" behavior still works.
  it('shows the missions section as read-only, with no mission authoring form', () => {
    render(<AdminPanel />)
    const missionsCard = document.querySelector('[data-section-id="missions"]')
    expect(missionsCard).toHaveTextContent('Status: Read-only foundation')
    expect(screen.queryByLabelText('Mission id')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add Mission' })).not.toBeInTheDocument()
  })

  it('updates the npcs item count live after creating an NPC through the CRUD form', () => {
    render(<AdminPanel />)
    const before = getAdminSections().find((section) => section.id === 'npcs')!.itemCount

    fireEvent.change(screen.getByLabelText('NPC id'), { target: { value: TEST_NPC_ID } })
    fireEvent.change(screen.getByLabelText('NPC name'), { target: { value: 'Panel Test NPC' } })
    fireEvent.change(screen.getByLabelText('NPC district'), { target: { value: 'core' } })
    fireEvent.change(screen.getByLabelText('NPC role'), { target: { value: 'Test Role' } })
    fireEvent.change(screen.getByLabelText('NPC description'), { target: { value: 'Description' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add NPC' }))

    const npcsCard = document.querySelector('[data-section-id="npcs"]')
    expect(npcsCard).toHaveTextContent(`Items: ${before + 1}`)

    removeNpc(TEST_NPC_ID)
  })
})
