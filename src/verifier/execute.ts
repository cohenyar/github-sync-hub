import type { Database } from 'sql.js'
import type { CellValue, Row } from './types'

export function executeSql(db: Database, sql: string): Row[] {
  const results = db.exec(sql)
  if (results.length === 0) return []

  const { columns, values } = results[0]
  return values.map((value) => {
    const row: Row = {}
    columns.forEach((col, i) => {
      row[col] = value[i] as unknown as CellValue
    })
    return row
  })
}
