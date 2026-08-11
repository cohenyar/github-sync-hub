// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { he } from '../i18n'

vi.mock('../cms', () => ({
  useAdminMetrics: () => ({ state: { status: 'loading' }, reload: vi.fn() }),
  useCourses: () => ({
    state: { status: 'ready', items: [] },
    reload: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  }),
  useUsers: () => ({ state: { status: 'ready', items: [] }, reload: vi.fn() }),
}))

import { AdminPage } from './AdminPage'

// Mirrors App.tsx's real mounting exactly (<Route path="/admin/*"
// element={<AdminPage/>}>) — AdminPage's own Navigate targets are absolute
// ("/admin/dashboard"), so rendering it bare at the router root (with no
// "/admin" prefix route) makes those absolute redirects point somewhere
// this tree never matches, which isn't the real app's behavior.
function renderAt(subPath: string) {
  return render(
    <MemoryRouter initialEntries={[`/admin${subPath}`]}>
      <Routes>
        <Route path="/admin/*" element={<AdminPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminPage', () => {
  it('redirects the bare index to the dashboard', () => {
    renderAt('')
    // he.adminNavDashboard and he.adminDashboardTitle are the same Hebrew
    // string, so the sidebar link and the page heading both match getByText —
    // scope to the heading specifically.
    expect(screen.getByRole('heading', { name: he.adminDashboardTitle })).toBeInTheDocument()
  })

  it('redirects an unrecognized admin sub-path to the dashboard rather than a dead end', () => {
    renderAt('/does-not-exist')
    expect(screen.getByRole('heading', { name: he.adminDashboardTitle })).toBeInTheDocument()
  })

  it('keeps the legacy in-memory admin tool reachable', () => {
    renderAt('/legacy')
    expect(screen.getByRole('heading', { name: he.adminNavLegacyTools })).toBeInTheDocument()
  })

  it('renders the courses management page', () => {
    renderAt('/courses')
    expect(screen.getByRole('heading', { name: he.adminNavCourses })).toBeInTheDocument()
  })
})
