import type { Database } from 'sql.js'
import { beforeEach, describe, expect, it } from 'vitest'
import { createTestDatabase } from '../verifier/testDb'
import { runQuery } from './runQuery'
import type { MissionConfig } from './types'

const mission: MissionConfig = {
  id: 'test-mission',
  title: 'Test Mission',
  goal: 'Return every citizen.',
  prompt: 'Query the citizens table.',
  setupSql: `
    CREATE TABLE citizens (id INTEGER, name TEXT);
    INSERT INTO citizens (id, name) VALUES (1, 'Iris Vell'), (2, 'Bram Osei');
  `,
  referenceSql: 'SELECT * FROM citizens',
}

describe('runQuery', () => {
  let db: Database

  beforeEach(async () => {
    db = await createTestDatabase()
    db.run(mission.setupSql)
  })

  it('returns a passing verdict when the learner query matches the reference', () => {
    const result = runQuery(db, 'SELECT * FROM citizens', mission)
    expect(result).toEqual({
      kind: 'verdict',
      verdict: expect.objectContaining({ pass: true }),
    })
  })

  it('returns a failing verdict when the learner query is missing rows', () => {
    const result = runQuery(db, 'SELECT * FROM citizens WHERE id = 1', mission)
    expect(result.kind).toBe('verdict')
    if (result.kind === 'verdict') {
      expect(result.verdict.pass).toBe(false)
      expect(result.verdict.missing).toEqual([{ id: 2, name: 'Bram Osei' }])
    }
  })

  it('returns an error result for invalid SQL instead of throwing', () => {
    const result = runQuery(db, 'SELEKT * FROM citizens', mission)
    expect(result.kind).toBe('error')
  })
})
