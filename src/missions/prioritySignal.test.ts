import { describe, expect, it } from 'vitest'
import { prioritySignalMission } from './prioritySignal'
import { runQuery } from './runQuery'
import { createTestDatabase } from '../verifier/testDb'

describe('prioritySignalMission', () => {
  it('sorts signal_reports by severity descending as its reference query', () => {
    expect(prioritySignalMission.referenceSql).toBe('SELECT * FROM signal_reports ORDER BY severity DESC;')
  })

  it('requires order-sensitive verification', () => {
    expect(prioritySignalMission.verifyOptions).toEqual({ ordered: true })
  })

  it('defines a success effect that improves stability in the South district', () => {
    expect(prioritySignalMission.successEffect).toEqual({
      kind: 'ADJUST_STAT',
      districtId: 'south',
      stat: 'stability',
      delta: 20,
    })
  })

  it('its own reference query passes against its own setupSql, in the exact expected order (content sanity check)', async () => {
    const db = await createTestDatabase()
    db.run(prioritySignalMission.setupSql)

    const result = runQuery(db, prioritySignalMission.referenceSql, prioritySignalMission)

    expect(result.kind).toBe('verdict')
    if (result.kind === 'verdict') {
      expect(result.verdict.pass).toBe(true)
      expect(result.verdict.actual.map((row) => row.severity)).toEqual([5, 4, 3, 2, 1])
    }
  })

  it('fails a query with the correct rows but the wrong order', async () => {
    const db = await createTestDatabase()
    db.run(prioritySignalMission.setupSql)

    // Same five rows (ascending instead of descending) — proves ordered
    // verification is actually exercised, not just declared.
    const result = runQuery(db, 'SELECT * FROM signal_reports ORDER BY severity ASC;', prioritySignalMission)

    expect(result.kind).toBe('verdict')
    if (result.kind === 'verdict') {
      expect(result.verdict.pass).toBe(false)
      expect(result.verdict.orderWrong).toBe(true)
      expect(result.verdict.missing).toEqual([])
      expect(result.verdict.extra).toEqual([])
    }
  })
})
