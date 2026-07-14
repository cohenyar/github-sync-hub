import { rowKey } from './rowKey'
import type { MultisetDiffResult, Row } from './types'

interface KeyCount {
  row: Row
  count: number
}

function countByKey(rows: readonly Row[], columns?: readonly string[]): Map<string, KeyCount> {
  const map = new Map<string, KeyCount>()
  for (const row of rows) {
    const key = rowKey(row, columns)
    const entry = map.get(key)
    if (entry) {
      entry.count += 1
    } else {
      map.set(key, { row, count: 1 })
    }
  }
  return map
}

export function multisetDiff(
  expected: readonly Row[],
  actual: readonly Row[],
  columns?: readonly string[],
): MultisetDiffResult<Row> {
  const expectedCounts = countByKey(expected, columns)
  const actualCounts = countByKey(actual, columns)

  const missing: Row[] = []
  const extra: Row[] = []
  const matched: Row[] = []

  for (const [key, { row, count }] of expectedCounts) {
    const actualCount = actualCounts.get(key)?.count ?? 0
    const matchedCount = Math.min(count, actualCount)
    for (let i = 0; i < matchedCount; i++) matched.push(row)
    for (let i = 0; i < count - matchedCount; i++) missing.push(row)
  }

  for (const [key, { row, count }] of actualCounts) {
    const expectedCount = expectedCounts.get(key)?.count ?? 0
    const matchedCount = Math.min(count, expectedCount)
    for (let i = 0; i < count - matchedCount; i++) extra.push(row)
  }

  return { missing, extra, matched }
}
