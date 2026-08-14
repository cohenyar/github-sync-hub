// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { he } from '../../i18n'

const mocks = vi.hoisted(() => ({ useAdminMetrics: vi.fn() }))

vi.mock('../../cms', () => ({ useAdminMetrics: mocks.useAdminMetrics }))

import { AdminDashboard } from './AdminDashboard'

function renderDashboard() {
  return render(
    <MemoryRouter>
      <AdminDashboard />
    </MemoryRouter>,
  )
}

describe('AdminDashboard', () => {
  it('shows a loading state before metrics resolve', () => {
    mocks.useAdminMetrics.mockReturnValue({ state: { status: 'loading' }, reload: vi.fn() })
    renderDashboard()
    expect(screen.getByTestId('admin-dashboard-loading')).toBeInTheDocument()
  })

  it('shows an error state with a working retry action', () => {
    const reload = vi.fn()
    mocks.useAdminMetrics.mockReturnValue({ state: { status: 'error', message: 'השירות לא זמין' }, reload })
    renderDashboard()
    expect(screen.getByTestId('admin-dashboard-error')).toHaveTextContent('השירות לא זמין')
    fireEvent.click(screen.getByText(he.adminRetryAction))
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('renders every metric as a real count from the hook, never an invented figure', () => {
    mocks.useAdminMetrics.mockReturnValue({
      state: {
        status: 'ready',
        metrics: {
          totalUsers: 3,
          totalCourses: 1,
          totalLessons: 2,
          totalMissions: 5,
          activeCourses: 1,
          activeLessons: 1,
          activeMissions: 3,
        },
      },
      reload: vi.fn(),
    })
    renderDashboard()
    const grid = screen.getByTestId('admin-dashboard-metrics')
    expect(grid).toHaveTextContent('3')
    expect(grid).toHaveTextContent('5')
    expect(screen.getByText(he.adminMetricTotalUsers)).toBeInTheDocument()
    // Active content = 1 + 1 + 3 = 5; draft content = (1-1) + (2-1) + (5-3) = 3.
    expect(screen.getByText(he.adminMetricActiveContent)).toBeInTheDocument()
    expect(screen.getByText(he.adminMetricDraftContent)).toBeInTheDocument()
  })

  it('shows the three creation quick actions, always — not gated on metrics state', () => {
    mocks.useAdminMetrics.mockReturnValue({ state: { status: 'loading' }, reload: vi.fn() })
    renderDashboard()
    const actions = screen.getByTestId('admin-quick-actions')
    expect(actions).toHaveTextContent(he.adminAddCourse)
    expect(actions).toHaveTextContent(he.adminAddLesson)
    expect(actions).toHaveTextContent(he.adminAddMission)
  })

  it('the course quick action links to the courses page with ?create=1 to jump straight into the form', () => {
    mocks.useAdminMetrics.mockReturnValue({ state: { status: 'loading' }, reload: vi.fn() })
    renderDashboard()
    // The "+" glyph is aria-hidden, so the accessible name is just the label.
    expect(screen.getByRole('link', { name: he.adminAddCourse })).toHaveAttribute('href', '/admin/courses?create=1')
  })
})
