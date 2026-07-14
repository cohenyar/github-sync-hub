// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { removeMission } from '../../missions'
import { getAdminSections } from '../selectors/adminSelectors'
import { AdminPanel } from './AdminPanel'

const TEST_ID = 'test-admin-panel-mission'

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

  it('updates the missions item count live after creating a mission through the CRUD form', () => {
    render(<AdminPanel />)
    const before = getAdminSections().find((section) => section.id === 'missions')!.itemCount

    fireEvent.change(screen.getByLabelText('Mission id'), { target: { value: TEST_ID } })
    fireEvent.change(screen.getByLabelText('Mission title'), { target: { value: 'Panel Test Mission' } })
    fireEvent.change(screen.getByLabelText('Mission goal'), { target: { value: 'Goal' } })
    fireEvent.change(screen.getByLabelText('Mission prompt'), { target: { value: 'Prompt' } })
    fireEvent.change(screen.getByLabelText('Mission setup SQL'), {
      target: { value: 'CREATE TABLE t (id INTEGER);' },
    })
    fireEvent.change(screen.getByLabelText('Mission reference SQL'), { target: { value: 'SELECT * FROM t;' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Mission' }))

    const missionsCard = document.querySelector('[data-section-id="missions"]')
    expect(missionsCard).toHaveTextContent(`Items: ${before + 1}`)

    removeMission(TEST_ID)
  })
})
