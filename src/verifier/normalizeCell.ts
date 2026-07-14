import type { CellValue } from './types'

export function normalizeCell(value: unknown): CellValue {
  if (value === undefined || value === null) return null

  if (typeof value === 'number') {
    return Object.is(value, -0) ? 0 : value
  }

  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'boolean') {
    return value
  }

  return String(value)
}
