// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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

vi.mock('../../cms', () => ({
  useCourses: () => ({
    state: { status: 'ready', items: [COURSE] },
    reload: vi.fn(),
    create: mocks.create,
    update: mocks.update,
    remove: mocks.remove,
  }),
}))

import { AdminCourses } from './AdminCourses'

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminCourses />
    </MemoryRouter>,
  )
}

describe('AdminCourses', () => {
  beforeEach(() => {
    mocks.create.mockClear()
    mocks.update.mockClear()
    mocks.remove.mockClear()
  })

  it('lists existing courses with their status', () => {
    renderPage()
    expect(screen.getByText('קורס לדוגמה')).toBeInTheDocument()
    expect(screen.getByText(he.adminStatusActive)).toBeInTheDocument()
  })

  it('validates the required title before calling create', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: he.adminAddCourse }))
    fireEvent.click(screen.getByText(he.adminSaveAction))
    // Both title and subject are empty, so the same required-field message
    // renders twice — assert presence, not a single unique match.
    expect((await screen.findAllByText(he.adminValidationRequired)).length).toBeGreaterThan(0)
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('creates a course once required fields are filled in', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: he.adminAddCourse }))
    fireEvent.change(screen.getByLabelText(he.adminFieldTitle), { target: { value: 'קורס חדש' } })
    fireEvent.change(screen.getByLabelText(he.adminFieldSubject), { target: { value: 'history' } })
    fireEvent.click(screen.getByText(he.adminSaveAction))
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'קורס חדש',
        subject: 'history',
        status: 'draft',
        npcConfig: expect.objectContaining({
          displayName: expect.any(String),
          role: expect.any(String),
          bodyColor: expect.stringMatching(/^#[0-9a-f]{6}$/i),
          skinTone: expect.stringMatching(/^#[0-9a-f]{6}$/i),
          hairColor: expect.stringMatching(/^#[0-9a-f]{6}$/i),
          shirtColor: expect.stringMatching(/^#[0-9a-f]{6}$/i),
          pantsColor: expect.stringMatching(/^#[0-9a-f]{6}$/i),
          hairStyle: expect.stringMatching(/^(short|long|bald|bun)$/),
        }),
      }),
    )
    expect(await screen.findByText(he.adminSaveSuccessMessage)).toBeInTheDocument()
  })

  it('prefills the course NPC section with sensible, non-empty defaults as soon as the create form opens', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: he.adminAddCourse }))

    const displayNameInput = screen.getByLabelText('שם הדמות') as HTMLInputElement
    const roleInput = screen.getByLabelText('תפקיד') as HTMLInputElement
    const bodyColorInput = screen.getByLabelText('צבע גוף') as HTMLInputElement
    const skinToneInput = screen.getByLabelText('גוון עור') as HTMLInputElement
    const hairColorInput = screen.getByLabelText('צבע שיער') as HTMLInputElement
    const shirtColorInput = screen.getByLabelText('צבע חולצה') as HTMLInputElement
    const pantsColorInput = screen.getByLabelText('צבע מכנסיים') as HTMLInputElement
    const hairStyleSelect = screen.getByLabelText('סגנון שיער') as HTMLSelectElement

    expect(displayNameInput.value).not.toBe('')
    expect(roleInput.value).not.toBe('')
    expect(bodyColorInput.value).toMatch(/^#[0-9a-f]{6}$/i)
    expect(skinToneInput.value).toMatch(/^#[0-9a-f]{6}$/i)
    expect(hairColorInput.value).toMatch(/^#[0-9a-f]{6}$/i)
    expect(shirtColorInput.value).toMatch(/^#[0-9a-f]{6}$/i)
    expect(pantsColorInput.value).toMatch(/^#[0-9a-f]{6}$/i)
    expect(['short', 'long', 'bald', 'bun']).toContain(hairStyleSelect.value)
  })

  it('warns before discarding unsaved changes instead of closing silently', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: he.adminAddCourse }))
    fireEvent.change(screen.getByLabelText(he.adminFieldTitle), { target: { value: 'טיוטה' } })
    fireEvent.click(screen.getByText(he.adminCancelAction))
    expect(screen.getByText(he.adminUnsavedChangesWarning)).toBeInTheDocument()
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('closes without a warning when there are no unsaved changes', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: he.adminAddCourse }))
    fireEvent.click(screen.getByText(he.adminCancelAction))
    expect(screen.queryByText(he.adminUnsavedChangesWarning)).not.toBeInTheDocument()
    expect(screen.queryByTestId('course-form')).not.toBeInTheDocument()
  })

  it('asks for confirmation before deleting a course, and only deletes on confirm', () => {
    renderPage()
    fireEvent.click(screen.getByText(he.adminDeleteAction))
    expect(screen.getByText(he.adminDeleteConfirmTitle)).toBeInTheDocument()
    expect(mocks.remove).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText(he.adminDeleteConfirmYes))
    expect(mocks.remove).toHaveBeenCalledWith('c1')
  })

  it('links each course row to its lessons', () => {
    renderPage()
    expect(screen.getByRole('link', { name: he.adminNavLessons })).toHaveAttribute(
      'href',
      '/admin/courses/c1/lessons',
    )
  })

  it('shows the course creation CTA up front, not hidden behind anything', () => {
    renderPage()
    expect(screen.getByRole('button', { name: he.adminAddCourse })).toBeVisible()
  })

  it('opens the create form as a real modal dialog, not just an inline panel', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: he.adminAddCourse }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByTestId('course-form')).toBeInTheDocument()
  })

  it('shows no AI-generation entry point — the feature is deferred until a real backend exists', () => {
    renderPage()
    expect(screen.queryByText('✨')).not.toBeInTheDocument()
    expect(screen.queryByText(/AI/)).not.toBeInTheDocument()
  })
})
