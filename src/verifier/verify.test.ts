import type { Database } from 'sql.js'
import { beforeEach, describe, expect, it } from 'vitest'
import { createTestDatabase } from './testDb'
import { verify } from './verify'

describe('verify', () => {
  let db: Database

  beforeEach(async () => {
    db = await createTestDatabase()
    db.run('CREATE TABLE t (id INTEGER, name TEXT)')
    db.run("INSERT INTO t VALUES (1, 'a'), (2, 'b'), (3, 'c')")
  })

  it('passes when learner and reference return the same rows in the same order', () => {
    const verdict = verify(db, 'SELECT * FROM t ORDER BY id', 'SELECT * FROM t ORDER BY id')
    expect(verdict.pass).toBe(true)
    expect(verdict.missing).toEqual([])
    expect(verdict.extra).toEqual([])
    expect(verdict.orderWrong).toBe(false)
  })

  it('passes on differing row order when ordered comparison is not requested', () => {
    const verdict = verify(db, 'SELECT * FROM t ORDER BY id DESC', 'SELECT * FROM t ORDER BY id ASC')
    expect(verdict.pass).toBe(true)
    expect(verdict.orderWrong).toBe(false)
  })

  it('fails and reports orderWrong when ordered comparison is requested and order differs', () => {
    const verdict = verify(db, 'SELECT * FROM t ORDER BY id DESC', 'SELECT * FROM t ORDER BY id ASC', {
      ordered: true,
    })
    expect(verdict.pass).toBe(false)
    expect(verdict.orderWrong).toBe(true)
    expect(verdict.missing).toEqual([])
    expect(verdict.extra).toEqual([])
  })

  it('passes with ordered comparison when both sets and order match', () => {
    const verdict = verify(db, 'SELECT * FROM t ORDER BY id ASC', 'SELECT * FROM t ORDER BY id ASC', {
      ordered: true,
    })
    expect(verdict.pass).toBe(true)
    expect(verdict.orderWrong).toBe(false)
  })

  it('reports missing rows when the learner is missing rows the reference has', () => {
    const verdict = verify(db, 'SELECT * FROM t WHERE id <= 2', 'SELECT * FROM t')
    expect(verdict.pass).toBe(false)
    expect(verdict.missing).toEqual([{ id: 3, name: 'c' }])
    expect(verdict.extra).toEqual([])
  })

  it('reports extra rows when the learner returns rows the reference does not', () => {
    const verdict = verify(db, 'SELECT * FROM t', 'SELECT * FROM t WHERE id <= 2')
    expect(verdict.pass).toBe(false)
    expect(verdict.extra).toEqual([{ id: 3, name: 'c' }])
    expect(verdict.missing).toEqual([])
  })

  it('restricts comparison to the projected columns', () => {
    const verdict = verify(db, 'SELECT id, name FROM t', 'SELECT id, 999 as name FROM t', {
      columns: ['id'],
    })
    expect(verdict.pass).toBe(true)
  })

  it('does not use projected-out columns to short-circuit a real mismatch', () => {
    const verdict = verify(db, 'SELECT id, name FROM t WHERE id <= 2', 'SELECT id, 999 as name FROM t', {
      columns: ['id'],
    })
    expect(verdict.pass).toBe(false)
    expect(verdict.missing).toEqual([{ id: 3 }])
  })
})
