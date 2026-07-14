import type { Row } from './types'

export function project(row: Row, columns: readonly string[]): Row {
  const result: Row = {}
  for (const col of columns) {
    result[col] = row[col] ?? null
  }
  return result
}

export function projectRows(rows: readonly Row[], columns: readonly string[]): Row[] {
  return rows.map((row) => project(row, columns))
}
