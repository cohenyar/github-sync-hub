// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createTestDatabase } from '../verifier/testDb'
import type { MissionConfig } from './types'
import { useMissionDatabase } from './useMissionDatabase'

const mission: MissionConfig = {
  id: 'test-mission',
  title: 'Test Mission',
  goal: 'Return every citizen.',
  prompt: 'Query the citizens table.',
  setupSql: "CREATE TABLE citizens (id INTEGER, name TEXT); INSERT INTO citizens VALUES (1, 'Iris Vell');",
  referenceSql: 'SELECT * FROM citizens',
}

describe('useMissionDatabase', () => {
  it('starts with no database while setup is pending', () => {
    const { result } = renderHook(() => useMissionDatabase(mission, createTestDatabase))
    expect(result.current.db).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('resolves to a database with the mission setupSql already applied', async () => {
    const { result } = renderHook(() => useMissionDatabase(mission, createTestDatabase))

    await waitFor(() => expect(result.current.db).not.toBeNull())

    const rows = result.current.db!.exec('SELECT * FROM citizens')
    expect(rows).toEqual([{ columns: ['id', 'name'], values: [[1, 'Iris Vell']] }])
  })

  it('surfaces an error instead of throwing when setupSql is invalid', async () => {
    const brokenMission: MissionConfig = { ...mission, setupSql: 'NOT VALID SQL' }
    const { result } = renderHook(() => useMissionDatabase(brokenMission, createTestDatabase))

    await waitFor(() => expect(result.current.error).not.toBeNull())
    expect(result.current.db).toBeNull()
  })

  it('re-initializes when the mission changes', async () => {
    const { result, rerender } = renderHook(({ m }) => useMissionDatabase(m, createTestDatabase), {
      initialProps: { m: mission },
    })
    await waitFor(() => expect(result.current.db).not.toBeNull())
    const firstDb = result.current.db

    const otherMission: MissionConfig = {
      ...mission,
      id: 'other-mission',
      setupSql: "CREATE TABLE citizens (id INTEGER, name TEXT); INSERT INTO citizens VALUES (2, 'Bram Osei');",
    }

    act(() => rerender({ m: otherMission }))
    await waitFor(() => expect(result.current.db).not.toBeNull())

    expect(result.current.db).not.toBe(firstDb)
    expect(result.current.db!.exec('SELECT * FROM citizens')).toEqual([
      { columns: ['id', 'name'], values: [[2, 'Bram Osei']] },
    ])
  })
})
