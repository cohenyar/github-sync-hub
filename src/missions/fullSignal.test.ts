import { describe, expect, it } from 'vitest'
import { fullSignalMission } from './fullSignal'
import { runQuery } from './runQuery'
import { createTestDatabase } from '../verifier/testDb'

describe('fullSignalMission', () => {
  it('groups citizens by district and counts them as its reference query', () => {
    expect(fullSignalMission.referenceSql).toBe('SELECT district, COUNT(*) AS total FROM citizens GROUP BY district;')
  })

  it('defines a success effect that advances the turn', () => {
    expect(fullSignalMission.successEffect).toEqual({ kind: 'ADVANCE_TURN' })
  })

  it('its own reference query passes against its own setupSql (content sanity check)', async () => {
    const db = await createTestDatabase()
    db.run(fullSignalMission.setupSql)

    const result = runQuery(db, fullSignalMission.referenceSql, fullSignalMission)

    expect(result.kind).toBe('verdict')
    if (result.kind === 'verdict') {
      expect(result.verdict.pass).toBe(true)
      expect(result.verdict.actual).toHaveLength(4)
      expect(result.verdict.actual).toEqual(
        expect.arrayContaining([
          { district: 'north', total: 2 },
          { district: 'south', total: 2 },
          { district: 'east', total: 1 },
          { district: 'core', total: 1 },
        ]),
      )
    }
  })

  it('an equivalent learner query (different column order in GROUP BY result) still passes', async () => {
    const db = await createTestDatabase()
    db.run(fullSignalMission.setupSql)

    // A learner selecting the same shape but grouping in a different order
    // should still match, since the Verifier's multiset diff is
    // order-independent across rows.
    const result = runQuery(
      db,
      'SELECT district, COUNT(*) AS total FROM citizens GROUP BY district ORDER BY district DESC;',
      fullSignalMission,
    )

    expect(result.kind).toBe('verdict')
    if (result.kind === 'verdict') {
      expect(result.verdict.pass).toBe(true)
    }
  })
})
