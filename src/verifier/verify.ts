import type { Database } from 'sql.js'
import { executeSql } from './execute'
import { multisetDiff } from './multisetDiff'
import { projectRows } from './projection'
import { rowKey } from './rowKey'
import type { Row } from './types'

export interface VerifyOptions {
  columns?: readonly string[]
  ordered?: boolean
}

export interface Verdict {
  pass: boolean
  missing: Row[]
  extra: Row[]
  orderWrong: boolean
  expected: Row[]
  actual: Row[]
}

export function verify(
  db: Database,
  learnerSql: string,
  referenceSql: string,
  options: VerifyOptions = {},
): Verdict {
  const rawActual = executeSql(db, learnerSql)
  const rawExpected = executeSql(db, referenceSql)

  const expected = options.columns ? projectRows(rawExpected, options.columns) : rawExpected
  const actual = options.columns ? projectRows(rawActual, options.columns) : rawActual

  const diff = multisetDiff(expected, actual)
  const setsMatch = diff.missing.length === 0 && diff.extra.length === 0

  const orderWrong = setsMatch && Boolean(options.ordered) && !rowsInSameOrder(expected, actual)
  const pass = setsMatch && !orderWrong

  return {
    pass,
    missing: diff.missing,
    extra: diff.extra,
    orderWrong,
    expected,
    actual,
  }
}

function rowsInSameOrder(expected: readonly Row[], actual: readonly Row[]): boolean {
  if (expected.length !== actual.length) return false
  return expected.every((row, i) => rowKey(row) === rowKey(actual[i]))
}
