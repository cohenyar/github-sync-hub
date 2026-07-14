import { describe, expect, it } from 'vitest'
import { runQuery } from './runQuery'
import { southStabilityMission } from './southStability'
import { createTestDatabase } from '../verifier/testDb'

describe('southStabilityMission', () => {
  it('filters district_reports by district and a minimum severity', () => {
    expect(southStabilityMission.referenceSql).toBe(
      "SELECT * FROM district_reports WHERE district = 'south' AND severity >= 3;",
    )
  })

  it('defines a success effect that improves stability in the South district', () => {
    expect(southStabilityMission.successEffect).toEqual({
      kind: 'ADJUST_STAT',
      districtId: 'south',
      stat: 'stability',
      delta: 30,
    })
  })

  it('its own reference query passes against its own setupSql (content sanity check)', async () => {
    const db = await createTestDatabase()
    db.run(southStabilityMission.setupSql)

    const result = runQuery(db, southStabilityMission.referenceSql, southStabilityMission)

    expect(result.kind).toBe('verdict')
    if (result.kind === 'verdict') {
      expect(result.verdict.pass).toBe(true)
      expect(result.verdict.actual).toEqual([
        { id: 1, district: 'south', issue: 'Water shortage', severity: 4 },
        { id: 4, district: 'south', issue: 'Power outage', severity: 5 },
      ])
    }
  })
})
