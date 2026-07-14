import type { Database } from 'sql.js'
import { beforeEach, describe, expect, it } from 'vitest'
import { verdictToEffect, verify } from '../verifier'
import { createTestDatabase } from '../verifier/testDb'
import { applyEffect, createWorldState } from '../worldState'

describe('SQL query -> Verifier -> Verdict -> WorldEffect -> WorldState', () => {
  let db: Database

  const effectOptions = { districtId: 'capital', stat: 'loyalty', passDelta: 5, failDelta: -2 }

  beforeEach(async () => {
    db = await createTestDatabase()
    db.run('CREATE TABLE t (id INTEGER, name TEXT)')
    db.run("INSERT INTO t VALUES (1, 'a'), (2, 'b'), (3, 'c')")
  })

  it('rewards a correct learner query by increasing the district stat', () => {
    const verdict = verify(db, 'SELECT * FROM t ORDER BY id', 'SELECT * FROM t ORDER BY id')
    expect(verdict.pass).toBe(true)

    const effect = verdictToEffect(verdict, effectOptions)
    const world = createWorldState([{ id: 'capital', stats: { loyalty: 10 } }])
    const next = applyEffect(world, effect)

    expect(next.districts.capital.stats.loyalty).toBe(15)
  })

  it('penalizes a learner query missing rows the reference has', () => {
    const verdict = verify(db, 'SELECT * FROM t WHERE id <= 1', 'SELECT * FROM t')
    expect(verdict.pass).toBe(false)
    expect(verdict.missing).toEqual([{ id: 2, name: 'b' }, { id: 3, name: 'c' }])

    const effect = verdictToEffect(verdict, effectOptions)
    const world = createWorldState([{ id: 'capital', stats: { loyalty: 10 } }])
    const next = applyEffect(world, effect)

    expect(next.districts.capital.stats.loyalty).toBe(8)
  })

  it('penalizes a learner query with the right rows in the wrong order', () => {
    const verdict = verify(db, 'SELECT * FROM t ORDER BY id DESC', 'SELECT * FROM t ORDER BY id ASC', {
      ordered: true,
    })
    expect(verdict.pass).toBe(false)
    expect(verdict.orderWrong).toBe(true)

    const effect = verdictToEffect(verdict, effectOptions)
    expect(effect.delta).toBe(-2)
  })

  it('never mutates the world state passed in — it produces a new one', () => {
    const verdict = verify(db, 'SELECT * FROM t ORDER BY id', 'SELECT * FROM t ORDER BY id')
    const effect = verdictToEffect(verdict, effectOptions)
    const world = createWorldState([{ id: 'capital', stats: { loyalty: 10 } }])

    const next = applyEffect(world, effect)

    expect(world.districts.capital.stats.loyalty).toBe(10)
    expect(next).not.toBe(world)
  })

  it('is deterministic end-to-end: running the same query through the whole pipeline twice yields equal results', () => {
    const world = createWorldState([{ id: 'capital', stats: { loyalty: 10 } }])

    function runPipeline() {
      const verdict = verify(db, 'SELECT * FROM t ORDER BY id', 'SELECT * FROM t ORDER BY id')
      const effect = verdictToEffect(verdict, effectOptions)
      return applyEffect(world, effect)
    }

    expect(runPipeline()).toEqual(runPipeline())
  })
})
