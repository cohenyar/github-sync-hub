import type { Database } from 'sql.js'
import { beforeEach, describe, expect, it } from 'vitest'
import { executeSql } from './execute'
import { createTestDatabase } from './testDb'

describe('executeSql', () => {
  let db: Database

  beforeEach(async () => {
    db = await createTestDatabase()
    db.run('CREATE TABLE t (id INTEGER, name TEXT)')
    db.run("INSERT INTO t VALUES (1, 'a'), (2, 'b')")
  })

  it('returns rows as records keyed by column name', () => {
    const rows = executeSql(db, 'SELECT * FROM t ORDER BY id')
    expect(rows).toEqual([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ])
  })

  it('returns an empty array when the query has no matching rows', () => {
    const rows = executeSql(db, 'SELECT * FROM t WHERE id = 999')
    expect(rows).toEqual([])
  })
})
