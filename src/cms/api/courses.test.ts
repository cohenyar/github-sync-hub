import { describe, expect, it, vi } from 'vitest'
import { createCourse, deleteCourse, listCourses, updateCourse } from './courses'

const mocks = vi.hoisted(() => ({ from: vi.fn() }))

vi.mock('../../auth/supabaseClient', () => ({
  cloudClientPromise: Promise.resolve({ from: mocks.from }),
}))

const ROW = {
  id: 'c1',
  title: 'קורס לדוגמה',
  description: 'תיאור',
  subject: 'history',
  status: 'active',
  display_order: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

describe('courses api', () => {
  it('maps snake_case rows to camelCase courses, ordered by display_order', async () => {
    const order = vi.fn(() => Promise.resolve({ data: [ROW], error: null }))
    mocks.from.mockReturnValue({ select: vi.fn(() => ({ order })) })

    const result = await listCourses()

    expect(result.error).toBeNull()
    expect(result.data).toEqual([
      {
        id: 'c1',
        title: 'קורס לדוגמה',
        description: 'תיאור',
        subject: 'history',
        status: 'active',
        displayOrder: 1,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ])
    expect(order).toHaveBeenCalledWith('display_order', { ascending: true })
  })

  it('returns a generic Hebrew error message, never the raw Postgres error, on failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.from.mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: null, error: { message: 'permission denied for table courses' } })),
      })),
    })

    const result = await listCourses()

    expect(result.data).toBeNull()
    expect(result.error).toBeTruthy()
    expect(result.error).not.toContain('permission denied')
    consoleSpy.mockRestore()
  })

  it('createCourse inserts a snake_case row built from the camelCase input', async () => {
    const insert = vi.fn(() => ({
      select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: ROW, error: null })) })),
    }))
    mocks.from.mockReturnValue({ insert })

    const result = await createCourse({
      title: 'קורס לדוגמה',
      description: 'תיאור',
      subject: 'history',
      status: 'active',
      displayOrder: 1,
    })

    expect(insert).toHaveBeenCalledWith({
      title: 'קורס לדוגמה',
      description: 'תיאור',
      subject: 'history',
      status: 'active',
      display_order: 1,
    })
    expect(result.data?.id).toBe('c1')
  })

  it('updateCourse targets the row by id', async () => {
    const eq = vi.fn(() => ({
      select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: ROW, error: null })) })),
    }))
    mocks.from.mockReturnValue({ update: vi.fn(() => ({ eq })) })

    await updateCourse('c1', {
      title: 'קורס לדוגמה',
      description: null,
      subject: 'history',
      status: 'draft',
      displayOrder: 2,
    })

    expect(eq).toHaveBeenCalledWith('id', 'c1')
  })

  it('deleteCourse resolves with no error on success', async () => {
    const eq = vi.fn(() => Promise.resolve({ error: null }))
    mocks.from.mockReturnValue({ delete: vi.fn(() => ({ eq })) })

    const result = await deleteCourse('c1')

    expect(result).toEqual({ data: null, error: null })
    expect(eq).toHaveBeenCalledWith('id', 'c1')
  })
})
