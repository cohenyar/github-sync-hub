// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthContext } from './AuthProvider'
import { ProtectedAdminRoute } from './ProtectedAdminRoute'
import type { AuthContextValue } from './types'

const BASE_AUTH: AuthContextValue = {
  status: 'signed-out',
  user: null,
  role: null,
  isAdmin: false,
  authError: null,
  configured: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
}

function renderGuarded(authValue: AuthContextValue) {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <AuthContext.Provider value={authValue}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <div role="region" aria-label="Admin Area">
                  real admin content
                </div>
              </ProtectedAdminRoute>
            }
          />
          <Route path="/" element={<div>public home</div>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('ProtectedAdminRoute', () => {
  it('shows a loading state and never the admin content while the session is still resolving', () => {
    renderGuarded({ ...BASE_AUTH, status: 'loading' })
    expect(screen.getByTestId('admin-route-loading')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Admin Area' })).not.toBeInTheDocument()
  })

  it('redirects a guest (signed-out) visitor to the public home screen', () => {
    renderGuarded({ ...BASE_AUTH, status: 'signed-out', isAdmin: false })
    expect(screen.getByText('public home')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Admin Area' })).not.toBeInTheDocument()
  })

  it('redirects a signed-in student (non-admin role) to the public home screen', () => {
    renderGuarded({
      ...BASE_AUTH,
      status: 'signed-in',
      user: { id: 'u1', email: 'student@example.com', avatarUrl: null, displayName: null },
      role: 'student',
      isAdmin: false,
    })
    expect(screen.getByText('public home')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Admin Area' })).not.toBeInTheDocument()
  })

  it('denies access when the role failed to resolve (missing profile / query error), even though a session exists', () => {
    renderGuarded({
      ...BASE_AUTH,
      status: 'signed-in',
      user: { id: 'u1', email: 'student@example.com', avatarUrl: null, displayName: null },
      role: null,
      isAdmin: false,
      authError: 'profile lookup failed',
    })
    expect(screen.getByText('public home')).toBeInTheDocument()
  })

  it('renders the admin content once the session resolves to the admin role', () => {
    renderGuarded({
      ...BASE_AUTH,
      status: 'signed-in',
      user: { id: 'admin-1', email: 'admin@example.com', avatarUrl: null, displayName: null },
      role: 'admin',
      isAdmin: true,
    })
    expect(screen.getByRole('region', { name: 'Admin Area' })).toBeInTheDocument()
  })
})
