// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getMissionById, missionRegistry, removeMission } from '../../missions'
import { MissionsAdminSection } from './MissionsAdminSection'

const TEST_ID = 'test-crud-mission-ui'

afterEach(() => {
  try {
    removeMission(TEST_ID)
  } catch {
    // not present; nothing to clean up
  }
})

function fillCreateForm() {
  fireEvent.change(screen.getByLabelText('Mission id'), { target: { value: TEST_ID } })
  fireEvent.change(screen.getByLabelText('Mission title'), { target: { value: 'UI Test Mission' } })
  fireEvent.change(screen.getByLabelText('Mission goal'), { target: { value: 'Goal' } })
  fireEvent.change(screen.getByLabelText('Mission prompt'), { target: { value: 'Prompt' } })
  fireEvent.change(screen.getByLabelText('Mission setup SQL'), { target: { value: 'CREATE TABLE t (id INTEGER);' } })
  fireEvent.change(screen.getByLabelText('Mission reference SQL'), { target: { value: 'SELECT * FROM t;' } })
}

describe('MissionsAdminSection', () => {
  it('lists every registered mission', () => {
    render(<MissionsAdminSection onChange={() => {}} />)
    for (const mission of missionRegistry) {
      expect(screen.getByText(mission.title)).toBeInTheDocument()
    }
  })

  it('creates a new mission through the form and notifies onChange', () => {
    const onChange = vi.fn()
    render(<MissionsAdminSection onChange={onChange} />)

    fillCreateForm()
    fireEvent.click(screen.getByRole('button', { name: 'Add Mission' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(getMissionById(TEST_ID)).toMatchObject({ title: 'UI Test Mission' })
  })

  it('shows validation errors and does not create a mission with a missing field', () => {
    const onChange = vi.fn()
    render(<MissionsAdminSection onChange={onChange} />)

    fillCreateForm()
    fireEvent.change(screen.getByLabelText('Mission title'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Mission' }))

    expect(screen.getByText('title must be a non-empty string')).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
    expect(getMissionById(TEST_ID)).toBeUndefined()
  })

  it('edits an existing mission and shows the updated title in the list', () => {
    const onChange = vi.fn()
    render(<MissionsAdminSection onChange={onChange} />)

    fillCreateForm()
    fireEvent.click(screen.getByRole('button', { name: 'Add Mission' }))

    fireEvent.click(screen.getByRole('button', { name: 'Edit UI Test Mission' }))
    fireEvent.change(screen.getByLabelText('Mission title'), { target: { value: 'Renamed Mission' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save Mission' }))

    expect(screen.getByText('Renamed Mission')).toBeInTheDocument()
    expect(screen.queryByText('UI Test Mission')).not.toBeInTheDocument()
  })

  it('deletes a mission and notifies onChange', () => {
    const onChange = vi.fn()
    render(<MissionsAdminSection onChange={onChange} />)

    fillCreateForm()
    fireEvent.click(screen.getByRole('button', { name: 'Add Mission' }))
    onChange.mockClear()

    fireEvent.click(screen.getByRole('button', { name: 'Delete UI Test Mission' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(getMissionById(TEST_ID)).toBeUndefined()
    expect(screen.queryByText('UI Test Mission')).not.toBeInTheDocument()
  })

  it('does not let the id be edited once a mission is selected for editing', () => {
    render(<MissionsAdminSection onChange={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: 'Edit First Contact' }))

    expect(screen.getByLabelText('Mission id')).toBeDisabled()
  })
})
