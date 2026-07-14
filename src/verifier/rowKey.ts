import { normalizeCell } from './normalizeCell'
import type { Row } from './types'

export function rowKey(row: Row, columns?: readonly string[]): string {
  const cols = columns ?? Object.keys(row).sort()
  const normalized = cols.map((col) => normalizeCell(row[col]))
  return JSON.stringify(normalized)
}
