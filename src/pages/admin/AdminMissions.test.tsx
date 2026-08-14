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

const MISSION = {
  id: 'm1',
  lessonId: 'l1',
  title: 'משימה לדוגמה',
  objective: 'מטרה',
  instructions: null,
  task: null,
  answerConfig: { type: 'exact_text' as const, acceptedAnswers: ['תשובה'] },
  hint: null,
  guidanceLevel1: null,
  guidanceLevel2: null,
  guidanceLevel3: null,
  displayOrder: 1,
  status: 'active' as const,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

vi.mock('../../cms', () => ({
  useLessons: () => ({ state: { status: 'ready', items: [LESSON] }, reload: vi.fn() }),
  useMissions: () => ({
    state: { status: 'ready', items: [MISSION] },
    reload: vi.fn(),
    create: mocks.create,
    update: mocks.update,
    remove: mocks.remove,
  }),
}))

import { AdminMissions } from './AdminMissions'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/courses/c1/lessons/l1/missions']}>
      <Routes>
        <Route path="/admin/courses/:courseId/lessons/:lessonId/missions" element={<AdminMissions />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminMissions', () => {
  beforeEach(() => {
    mocks.create.mockClear()
    mocks.update.mockClear()
    mocks.remove.mockClear()
  })

  it('lists existing missions with their status, under the right lesson breadcrumb', () => {
    renderPage()
    expect(screen.getByText('משימה לדוגמה')).toBeInTheDocument()
    expect(screen.getByText('שיעור לדוגמה')).toBeInTheDocument()
  })

  it('shows the mission creation CTA up front', () => {
    renderPage()
    expect(screen.getByRole('button', { name: he.adminAddMission })).toBeVisible()
  })

  it('opens the create form as a real modal dialog', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: he.adminAddMission }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByTestId('mission-form')).toBeInTheDocument()
  })

  it('creates a mission with an exact-text answer once required fields are filled in', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: he.adminAddMission }))
    fireEvent.change(screen.getByLabelText(he.adminFieldTitle), { target: { value: 'משימה חדשה' } })
    fireEvent.change(screen.getByLabelText(he.adminFieldObjective), { target: { value: 'מטרה חדשה' } })
    fireEvent.change(screen.getByLabelText(he.adminFieldAcceptedAnswers), { target: { value: 'תשובה' } })
    fireEvent.click(screen.getByText(he.adminSaveAction))
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'משימה חדשה',
        objective: 'מטרה חדשה',
        lessonId: 'l1',
        answerConfig: { type: 'exact_text', acceptedAnswers: ['תשובה'] },
      }),
    )
    expect(await screen.findByText(he.adminSaveSuccessMessage)).toBeInTheDocument()
  })

  it('validates required fields and the answer before calling create', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: he.adminAddMission }))
    fireEvent.click(screen.getByText(he.adminSaveAction))
    expect(await screen.findAllByText(he.adminValidationRequired)).toHaveLength(2)
    expect(screen.getByText(he.adminValidationNeedAnswer)).toBeInTheDocument()
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('warns before discarding unsaved changes', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: he.adminAddMission }))
    fireEvent.change(screen.getByLabelText(he.adminFieldTitle), { target: { value: 'טיוטה' } })
    fireEvent.click(screen.getByText(he.adminCancelAction))
    expect(screen.getByText(he.adminUnsavedChangesWarning)).toBeInTheDocument()
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('asks for confirmation before deleting a mission', () => {
    renderPage()
    fireEvent.click(screen.getByText(he.adminDeleteAction))
    expect(screen.getByText(he.adminDeleteConfirmTitle)).toBeInTheDocument()
    fireEvent.click(screen.getByText(he.adminDeleteConfirmYes))
    expect(mocks.remove).toHaveBeenCalledWith('m1')
  })
})
