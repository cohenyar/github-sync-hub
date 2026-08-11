import { describe, expect, it, vi } from 'vitest'
import { createMission, listMissions } from './missions'

const mocks = vi.hoisted(() => ({ from: vi.fn() }))

vi.mock('../../auth/supabaseClient', () => ({
  cloudClientPromise: Promise.resolve({ from: mocks.from }),
}))

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'm1',
    lesson_id: 'l1',
    title: 'משימה לדוגמה',
    objective: 'מטרה',
    instructions: null,
    task: null,
    answer_config: { type: 'exact_text', acceptedAnswers: ['שומר'] },
    hint: null,
    guidance_level_1: null,
    guidance_level_2: null,
    guidance_level_3: null,
    display_order: 1,
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('missions api — answer_config parsing', () => {
  it('parses a valid exact_text answer_config', async () => {
    mocks.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: [row()], error: null })) })),
      })),
    })

    const result = await listMissions('l1')

    expect(result.data?.[0]?.answerConfig).toEqual({ type: 'exact_text', acceptedAnswers: ['שומר'] })
  })

  it('parses a valid multiple_choice answer_config', async () => {
    mocks.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({
              data: [row({ answer_config: { type: 'multiple_choice', options: ['א', 'ב'], correctIndex: 1 } })],
              error: null,
            }),
          ),
        })),
      })),
    })

    const result = await listMissions('l1')

    expect(result.data?.[0]?.answerConfig).toEqual({ type: 'multiple_choice', options: ['א', 'ב'], correctIndex: 1 })
  })

  it('drops a malformed or unrecognized answer_config to null rather than trusting it', async () => {
    mocks.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({ data: [row({ answer_config: { type: 'not-a-real-type' } })], error: null }),
          ),
        })),
      })),
    })

    const result = await listMissions('l1')

    expect(result.data?.[0]?.answerConfig).toBeNull()
  })

  it('treats a null answer_config as null, not as malformed', async () => {
    mocks.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [row({ answer_config: null })], error: null })),
        })),
      })),
    })

    const result = await listMissions('l1')

    expect(result.data?.[0]?.answerConfig).toBeNull()
  })

  it('createMission serializes an answerConfig into the jsonb column untouched', async () => {
    const insert = vi.fn(() => ({
      select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: row(), error: null })) })),
    }))
    mocks.from.mockReturnValue({ insert })

    await createMission({
      lessonId: 'l1',
      title: 'משימה לדוגמה',
      objective: 'מטרה',
      instructions: null,
      task: null,
      answerConfig: { type: 'multiple_choice', options: ['א', 'ב'], correctIndex: 1 },
      hint: null,
      guidanceLevel1: null,
      guidanceLevel2: null,
      guidanceLevel3: null,
      status: 'draft',
      displayOrder: 0,
    })

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ answer_config: { type: 'multiple_choice', options: ['א', 'ב'], correctIndex: 1 } }),
    )
  })
})
