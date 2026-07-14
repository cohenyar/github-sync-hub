// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AppRoutes } from './App'
import { he } from './i18n'

// GameApp (mounted at /world) needs the same test-friendly database loader
// every existing GameApp test already relies on.
vi.mock('./db/database', async () => {
  const { createTestDatabase } = await import('./verifier/testDb')
  return { createDatabase: createTestDatabase }
})

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

describe('Routing foundation', () => {
  it('renders the landing page at /', () => {
    renderAt('/')
    expect(screen.getByText(he.landingTagline)).toBeInTheDocument()
  })

  it('renders the real game, unwrapped, at /world', async () => {
    renderAt('/world')
    expect(await screen.findByRole('button', { name: 'Run' })).toBeInTheDocument()
  })

  it.each([
    ['/dashboard', he.navDashboardLabel],
    ['/courses', he.navCoursesLabel],
    ['/tutor', he.navTutorLabel],
    ['/progress', he.navProgressLabel],
    ['/profile', he.navProfileLabel],
  ])('renders the %s placeholder', (path, title) => {
    renderAt(path)
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
  })

  it('reads the :courseId param on /courses/:courseId', () => {
    renderAt('/courses/sql-basics')
    expect(screen.getByText(`${he.courseDetailPrefix}sql-basics`)).toBeInTheDocument()
  })

  it('renders NotFound for an unknown path, with a way back to the landing page', () => {
    renderAt('/this-route-does-not-exist')
    expect(screen.getByText(he.notFoundTitle)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: he.notFoundBackLink })).toHaveAttribute('href', '/')
  })
})
