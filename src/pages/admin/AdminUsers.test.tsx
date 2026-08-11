// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { he } from '../../i18n'

vi.mock('../../cms', () => ({
  useUsers: () => ({
    state: {
      status: 'ready',
      items: [
        { id: 'u1', email: 'student@example.com', displayName: 'תלמיד לדוגמה', role: 'student', joinedAt: '2026-01-01T00:00:00Z' },
      ],
    },
    reload: vi.fn(),
  }),
}))

import { AdminUsers } from './AdminUsers'

describe('AdminUsers', () => {
  it('renders the user with a translated role label', () => {
    render(<AdminUsers />)
    expect(screen.getByText('תלמיד לדוגמה')).toBeInTheDocument()
    expect(screen.getByText('student@example.com')).toBeInTheDocument()
    expect(screen.getByText(he.adminRoleStudent)).toBeInTheDocument()
  })

  it('is read-only: renders no edit/delete/save controls anywhere on the page', () => {
    render(<AdminUsers />)
    expect(screen.queryByText(he.adminEditAction)).not.toBeInTheDocument()
    expect(screen.queryByText(he.adminDeleteAction)).not.toBeInTheDocument()
    expect(screen.queryByText(he.adminSaveAction)).not.toBeInTheDocument()
  })

  it('never renders anything resembling a password/token/credential column', () => {
    render(<AdminUsers />)
    expect(screen.queryByText(/password|token|secret/i)).not.toBeInTheDocument()
  })
})
