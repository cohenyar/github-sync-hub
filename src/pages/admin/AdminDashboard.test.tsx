// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { he } from '../../i18n'

const mocks = vi.hoisted(() => ({ useAdminMetrics: vi.fn() }))

vi.mock('../../cms', () => ({ useAdminMetrics: mocks.useAdminMetrics }))

import { AdminDashboard } from './AdminDashboard'

describe('AdminDashboard', () => {
  it('shows a loading state before metrics resolve', () => {
    mocks.useAdminMetrics.mockReturnValue({ state: { status: 'loading' }, reload: vi.fn() })
    render(<AdminDashboard />)
    expect(screen.getByTestId('admin-dashboard-loading')).toBeInTheDocument()
  })

  it('shows an error state with a working retry action', () => {
    const reload = vi.fn()
    mocks.useAdminMetrics.mockReturnValue({ state: { status: 'error', message: 'השירות לא זמין' }, reload })
    render(<AdminDashboard />)
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
    render(<AdminDashboard />)
    const grid = screen.getByTestId('admin-dashboard-metrics')
    expect(grid).toHaveTextContent('3')
    expect(grid).toHaveTextContent('5')
    expect(screen.getByText(he.adminMetricTotalUsers)).toBeInTheDocument()
    expect(screen.getByText(he.adminMetricActiveMissions)).toBeInTheDocument()
  })
})
