import { describe, expect, it } from 'vitest'
import { linkedRecordsMission } from './linkedRecords'
import { runQuery } from './runQuery'
import { createTestDatabase } from '../verifier/testDb'

describe('linkedRecordsMission', () => {
  it('joins citizens to district_officials on district as its reference query', () => {
    expect(linkedRecordsMission.referenceSql).toBe(
      'SELECT citizens.name, district_officials.official ' +
        'FROM citizens JOIN district_officials ON citizens.district = district_officials.district;',
    )
  })

  it('defines a success effect that improves stability in the North district', () => {
    expect(linkedRecordsMission.successEffect).toEqual({
      kind: 'ADJUST_STAT',
      districtId: 'north',
      stat: 'stability',
      delta: 15,
    })
  })

  it('its own reference query passes against its own setupSql (content sanity check)', async () => {
    const db = await createTestDatabase()
    db.run(linkedRecordsMission.setupSql)

    const result = runQuery(db, linkedRecordsMission.referenceSql, linkedRecordsMission)

    expect(result.kind).toBe('verdict')
    if (result.kind === 'verdict') {
      expect(result.verdict.pass).toBe(true)
      expect(result.verdict.actual).toHaveLength(6)
      expect(result.verdict.actual).toEqual(
        expect.arrayContaining([
          { name: 'Iris Vell', official: 'Devrin Kass' },
          { name: 'Bram Osei', official: 'Priya Nandall' },
          { name: 'Talia Nkemdirim', official: 'Devrin Kass' },
          { name: 'Coen Adeyemi', official: 'Tomas Reyeth' },
          { name: 'Nora Kessel', official: 'Priya Nandall' },
          { name: 'Petra Voss', official: 'Mera Solt' },
        ]),
      )
    }
  })

  it('an equivalent learner query (different join order) still passes', async () => {
    const db = await createTestDatabase()
    db.run(linkedRecordsMission.setupSql)

    // A learner joining in reverse order but selecting the same two columns
    // should still match, since column identity — not table order — is
    // what the Verifier compares.
    const result = runQuery(
      db,
      'SELECT citizens.name, district_officials.official ' +
        'FROM district_officials JOIN citizens ON citizens.district = district_officials.district;',
      linkedRecordsMission,
    )

    expect(result.kind).toBe('verdict')
    if (result.kind === 'verdict') {
      expect(result.verdict.pass).toBe(true)
    }
  })
})
