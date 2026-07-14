// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getNpcById, npcRegistry, removeNpc } from '../../npcs'
import { NpcsAdminSection } from './NpcsAdminSection'

const TEST_ID = 'test-crud-npc-ui'

afterEach(() => {
  try {
    removeNpc(TEST_ID)
  } catch {
    // not present; nothing to clean up
  }
})

function fillCreateForm() {
  fireEvent.change(screen.getByLabelText('NPC id'), { target: { value: TEST_ID } })
  fireEvent.change(screen.getByLabelText('NPC name'), { target: { value: 'UI Test NPC' } })
  fireEvent.change(screen.getByLabelText('NPC district'), { target: { value: 'north' } })
  fireEvent.change(screen.getByLabelText('NPC role'), { target: { value: 'Tester' } })
  fireEvent.change(screen.getByLabelText('NPC description'), { target: { value: 'A test NPC.' } })
}

describe('NpcsAdminSection', () => {
  it('lists every registered NPC', () => {
    render(<NpcsAdminSection onChange={() => {}} />)
    for (const npc of npcRegistry) {
      expect(screen.getByText(npc.name)).toBeInTheDocument()
    }
  })

  it('creates a new NPC through the form and notifies onChange', () => {
    const onChange = vi.fn()
    render(<NpcsAdminSection onChange={onChange} />)

    fillCreateForm()
    fireEvent.click(screen.getByRole('button', { name: 'Add NPC' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(getNpcById(TEST_ID)).toMatchObject({ name: 'UI Test NPC', districtId: 'north' })
  })

  it('shows validation errors for an invalid district and does not create the NPC', () => {
    const onChange = vi.fn()
    render(<NpcsAdminSection onChange={onChange} />)

    fillCreateForm()
    fireEvent.change(screen.getByLabelText('NPC district'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add NPC' }))

    expect(screen.getByText('districtId must be a non-empty string')).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
    expect(getNpcById(TEST_ID)).toBeUndefined()
  })

  it('edits an existing NPC and shows the updated name in the list', () => {
    render(<NpcsAdminSection onChange={() => {}} />)

    fillCreateForm()
    fireEvent.click(screen.getByRole('button', { name: 'Add NPC' }))

    fireEvent.click(screen.getByRole('button', { name: 'Edit UI Test NPC' }))
    fireEvent.change(screen.getByLabelText('NPC name'), { target: { value: 'Renamed NPC' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save NPC' }))

    expect(screen.getByText('Renamed NPC')).toBeInTheDocument()
    expect(screen.queryByText('UI Test NPC')).not.toBeInTheDocument()
  })

  it('deletes an NPC and notifies onChange', () => {
    const onChange = vi.fn()
    render(<NpcsAdminSection onChange={onChange} />)

    fillCreateForm()
    fireEvent.click(screen.getByRole('button', { name: 'Add NPC' }))
    onChange.mockClear()

    fireEvent.click(screen.getByRole('button', { name: 'Delete UI Test NPC' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(getNpcById(TEST_ID)).toBeUndefined()
    expect(screen.queryByText('UI Test NPC')).not.toBeInTheDocument()
  })
})
