// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { he } from '../../i18n'
import { AdminLayout } from './AdminLayout'

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/admin/dashboard']}>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<div>dashboard content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminLayout', () => {
  it('renders every top-level nav destination from the spec (dashboard/courses/users/legacy)', () => {
    renderLayout()
    expect(screen.getByRole('link', { name: he.adminNavDashboard })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: he.adminNavCourses })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: he.adminNavUsers })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: he.adminNavLegacyTools })).toBeInTheDocument()
  })

  it('renders the active nested route content via Outlet', () => {
    renderLayout()
    expect(screen.getByText('dashboard content')).toBeInTheDocument()
  })

  it('provides a back-to-game link', () => {
    renderLayout()
    expect(screen.getByRole('link', { name: he.adminBackToGame })).toHaveAttribute('href', '/dashboard')
  })

  it('toggles the mobile nav menu open and closed', () => {
    renderLayout()
    const toggle = screen.getByTestId('admin-menu-toggle')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })
})
