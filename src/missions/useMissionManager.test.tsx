// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createTestDatabase } from '../verifier/testDb'
import type { MissionConfig } from './types'
import { useMissionManager, type UseMissionManagerOptions } from './useMissionManager'

const mission: MissionConfig = {
  id: 'test-mission',
  title: 'Test Mission',
  goal: 'goal',
  prompt: 'prompt',
  setupSql: "CREATE TABLE citizens (id INTEGER, name TEXT); INSERT INTO citizens VALUES (1, 'Iris Vell');",
  referenceSql: 'SELECT * FROM citizens',
  successEffect: { kind: 'SET_STAT', districtId: 'core', stat: 'signal', value: 100 },
}

async function renderReady(
  onComplete?: (mission: MissionConfig) => void,
  onFailure?: UseMissionManagerOptions['onFailure'],
) {
  const view = renderHook(() => useMissionManager(mission, { createDb: createTestDatabase, onComplete, onFailure }))
  await waitFor(() => expect(view.result.current.status.phase).toBe('active'))
  return view
}

describe('useMissionManager', () => {
  it('starts in the loading phase', () => {
    const { result } = renderHook(() => useMissionManager(mission, { createDb: createTestDatabase }))
    expect(result.current.status.phase).toBe('loading')
    expect(result.current.status.lastResult).toBeNull()
  })

  it('transitions to active once the database is ready', async () => {
    await renderReady()
  })

  it('does nothing when run is called before the database is ready', () => {
    const { result } = renderHook(() => useMissionManager(mission, { createDb: createTestDatabase }))
    act(() => result.current.run('SELECT * FROM citizens'))
    expect(result.current.status.lastResult).toBeNull()
    expect(result.current.status.phase).toBe('loading')
  })

  it('records a passing verdict and transitions to completed', async () => {
    const { result } = await renderReady()

    act(() => result.current.run('SELECT * FROM citizens'))

    expect(result.current.status.phase).toBe('completed')
    expect(result.current.status.lastResult?.kind).toBe('verdict')
  })

  it('records a failing verdict without completing the mission', async () => {
    const { result } = await renderReady()

    act(() => result.current.run('SELECT * FROM citizens WHERE id = 999'))

    expect(result.current.status.phase).toBe('active')
    expect(
      result.current.status.lastResult?.kind === 'verdict' && result.current.status.lastResult.verdict.pass,
    ).toBe(false)
  })

  it('stays completed even if a later run fails', async () => {
    const { result } = await renderReady()

    act(() => result.current.run('SELECT * FROM citizens'))
    expect(result.current.status.phase).toBe('completed')

    act(() => result.current.run('SELECT * FROM citizens WHERE id = 999'))
    expect(result.current.status.phase).toBe('completed')
  })

  it('calls onComplete exactly once, even across repeated passing runs', async () => {
    const onComplete = vi.fn()
    const { result } = await renderReady(onComplete)

    act(() => result.current.run('SELECT * FROM citizens'))
    act(() => result.current.run('SELECT * FROM citizens'))

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith(mission)
  })

  it('calls onFailure with the mismatched result when a verdict fails', async () => {
    const onFailure = vi.fn()
    const { result } = await renderReady(undefined, onFailure)

    act(() => result.current.run('SELECT * FROM citizens WHERE id = 999'))

    expect(onFailure).toHaveBeenCalledTimes(1)
    const [calledMission, calledResult] = onFailure.mock.calls[0]
    expect(calledMission).toBe(mission)
    expect(calledResult.kind).toBe('verdict')
    expect(calledResult.verdict.pass).toBe(false)
  })

  it('calls onFailure with the error result when the SQL is invalid', async () => {
    const onFailure = vi.fn()
    const { result } = await renderReady(undefined, onFailure)

    act(() => result.current.run('NOT VALID SQL'))

    expect(onFailure).toHaveBeenCalledTimes(1)
    expect(onFailure.mock.calls[0][1].kind).toBe('error')
  })

  it('does not call onFailure on a passing run', async () => {
    const onFailure = vi.fn()
    const { result } = await renderReady(undefined, onFailure)

    act(() => result.current.run('SELECT * FROM citizens'))

    expect(onFailure).not.toHaveBeenCalled()
  })

  it('still calls onFailure on a later failing run after the mission is already completed', async () => {
    const onFailure = vi.fn()
    const { result } = await renderReady(undefined, onFailure)

    act(() => result.current.run('SELECT * FROM citizens'))
    act(() => result.current.run('SELECT * FROM citizens WHERE id = 999'))

    expect(onFailure).toHaveBeenCalledTimes(1)
  })

  it('seeds an already-completed status when initiallyCompleted is true, without calling onComplete', async () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() =>
      useMissionManager(mission, { createDb: createTestDatabase, onComplete, initiallyCompleted: true }),
    )

    // Never observably passes through 'active' — completion must be visible
    // the moment the database finishes preparing, not one tick later.
    await waitFor(() => expect(result.current.status.phase).toBe('completed'))
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('stays in the loading phase while the database prepares, even when initiallyCompleted is true', () => {
    const { result } = renderHook(() =>
      useMissionManager(mission, { createDb: createTestDatabase, initiallyCompleted: true }),
    )

    expect(result.current.status.phase).toBe('loading')
  })

  it('still evaluates a fresh run correctly after being seeded as completed', async () => {
    const { result } = renderHook(() =>
      useMissionManager(mission, { createDb: createTestDatabase, initiallyCompleted: true }),
    )
    await waitFor(() => expect(result.current.status.phase).toBe('completed'))

    act(() => result.current.run('SELECT * FROM citizens'))

    expect(result.current.status.phase).toBe('completed')
    expect(result.current.status.lastResult?.kind).toBe('verdict')
  })

  it('surfaces a database setup error as the error phase', async () => {
    const broken: MissionConfig = { ...mission, setupSql: 'NOT VALID SQL' }
    const { result } = renderHook(() => useMissionManager(broken, { createDb: createTestDatabase }))

    await waitFor(() => expect(result.current.status.phase).toBe('error'))
    expect(result.current.status.error).not.toBeNull()
  })
})
