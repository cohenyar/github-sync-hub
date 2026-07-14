export type CellValue = string | number | boolean | null

export type Row = Record<string, CellValue>

export interface MultisetDiffResult<T> {
  missing: T[]
  extra: T[]
  matched: T[]
}
