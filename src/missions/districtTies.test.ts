import { describe, expect, it } from 'vitest'
import { runQuery } from './runQuery'
import { createTestDatabase } from '../verifier/testDb'
import { districtTiesMission } from './districtTies'

describe('districtTiesMission', () => {
  it('filters the citizens table by district as its reference query', () => {
    expect(districtTiesMission.referenceSql).toBe("SELECT * FROM citizens WHERE district = 'north';")
  })

  it('defines a success effect that strengthens loyalty in the North district', () => {
    expect(districtTiesMission.successEffect).toEqual({
      kind: 'ADJUST_STAT',
      districtId: 'north',
      stat: 'loyalty',
      delta: 15,
    })
  })

  it('its own reference query passes against its own setupSql (content sanity check)', async () => {
    const db = await createTestDatabase()
    db.run(districtTiesMission.setupSql)

    const result = runQuery(db, districtTiesMission.referenceSql, districtTiesMission)

    expect(result.kind).toBe('verdict')
    if (result.kind === 'verdict') {
      expect(result.verdict.pass).toBe(true)
      expect(result.verdict.actual).toEqual([
        { id: 1, name: 'Iris Vell', district: 'north' },
        { id: 3, name: 'Talia Nkemdirim', district: 'north' },
      ])
    }
  })
})
