// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '../auth'
import { he } from '../i18n'
import { Dashboard } from './Dashboard'

// Dashboard renders through PageShell, which reads useAuth() for the Admin
// link/AuthButton — this mirrors App.tsx's real tree, where AuthProvider
// always wraps every route.
function renderDashboard() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Dashboard />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('Dashboard', () => {
  it('shows the subject-selection heading', () => {
    renderDashboard()
    expect(screen.getByRole('heading', { name: he.dashboardHeading })).toBeInTheDocument()
  })

  it('renders a Mathematics card linking to /world with the math path', () => {
    renderDashboard()
    const card = screen.getByTestId('subject-card-math')
    expect(card).toHaveAttribute('href', '/world?path=math')
    expect(card).toHaveTextContent(he.subjectMathLabel)
  })

  it('renders an English-from-Hebrew card linking to /world with the english path', () => {
    renderDashboard()
    const card = screen.getByTestId('subject-card-english')
    expect(card).toHaveAttribute('href', '/world?path=english')
    expect(card).toHaveTextContent(he.subjectEnglishLabel)
  })

  it('renders coming-later cards that are not links and carry the coming-soon badge', () => {
    renderDashboard()
    const comingLater = screen.getAllByTestId('subject-card-coming-later')
    expect(comingLater.length).toBeGreaterThan(0)
    for (const card of comingLater) {
      expect(card.tagName).not.toBe('A')
      expect(card).toHaveAttribute('aria-disabled', 'true')
      expect(card).toHaveTextContent(he.comingLaterBadge)
    }
  })
})
