// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { he } from '../../i18n'

const mocks = vi.hoisted(() => ({
  create: vi.fn(async () => ({ data: null, error: null })),
  update: vi.fn(async () => ({ data: null, error: null })),
  remove: vi.fn(async () => ({ data: null, error: null })),
}))

const COURSE = {
  id: 'c1',
  title: 'קורס לדוגמה',
  description: null,
  subject: 'history',
  status: 'active' as const,
  displayOrder: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const LESSON = {
  id: 'l1',
  courseId: 'c1',
  title: 'שיעור לדוגמה',
  content: null,
  displayOrder: 1,
  status: 'active' as const,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

vi.mock('../../cms', () => ({
  useCourses: () => ({ state: { status: 'ready', items: [COURSE] }, reload: vi.fn() }),
  useLessons: () => ({
    state: { status: 'ready', items: [LESSON] },
    reload: vi.fn(),
    create: mocks.create,
    update: mocks.update,
    remove: mocks.remove,
  }),
}))

import { AdminLessons } from './AdminLessons'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/courses/c1/lessons']}>
      <Routes>
        <Route path="/admin/courses/:courseId/lessons" element={<AdminLessons />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminLessons', () => {
  beforeEach(() => {
    mocks.create.mockClear()
    mocks.update.mockClear()
    mocks.remove.mockClear()
  })

  it('lists existing lessons with their status, under the right course breadcrumb', () => {
    renderPage()
    expect(screen.getByText('שיעור לדוגמה')).toBeInTheDocument()
    expect(screen.getByText('קורס לדוגמה')).toBeInTheDocument()
  })

  it('shows the lesson creation CTA up front', () => {
    renderPage()
    expect(screen.getByRole('button', { name: he.adminAddLesson })).toBeVisible()
  })

  it('opens the create form as a real modal dialog', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: he.adminAddLesson }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByTestId('lesson-form')).toBeInTheDocument()
  })

  it('creates a lesson once the title is filled in, scoped to the current course', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: he.adminAddLesson }))
    fireEvent.change(screen.getByLabelText(he.adminFieldTitle), { target: { value: 'שיעור חדש' } })
    fireEvent.click(screen.getByText(he.adminSaveAction))
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'שיעור חדש', courseId: 'c1' }))
    expect(await screen.findByText(he.adminSaveSuccessMessage)).toBeInTheDocument()
  })

  it('validates the required title before calling create', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: he.adminAddLesson }))
    fireEvent.click(screen.getByText(he.adminSaveAction))
    expect(await screen.findByText(he.adminValidationRequired)).toBeInTheDocument()
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('warns before discarding unsaved changes', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: he.adminAddLesson }))
    fireEvent.change(screen.getByLabelText(he.adminFieldTitle), { target: { value: 'טיוטה' } })
    fireEvent.click(screen.getByText(he.adminCancelAction))
    expect(screen.getByText(he.adminUnsavedChangesWarning)).toBeInTheDocument()
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('asks for confirmation before deleting a lesson', () => {
    renderPage()
    fireEvent.click(screen.getByText(he.adminDeleteAction))
    expect(screen.getByText(he.adminDeleteConfirmTitle)).toBeInTheDocument()
    fireEvent.click(screen.getByText(he.adminDeleteConfirmYes))
    expect(mocks.remove).toHaveBeenCalledWith('l1')
  })

  it('links each lesson row to its missions', () => {
    renderPage()
    expect(screen.getByRole('link', { name: he.adminNavMissions })).toHaveAttribute(
      'href',
      '/admin/courses/c1/lessons/l1/missions',
    )
  })
})
