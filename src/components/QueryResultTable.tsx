import type { Row } from '../verifier'
import styles from './QueryResultTable.module.css'

export interface QueryResultTableProps {
  rows: readonly Row[]
}

export function QueryResultTable({ rows }: QueryResultTableProps) {
  if (rows.length === 0) {
    return <p className={styles.empty}>No rows returned.</p>
  }

  const columns = Object.keys(rows[0])

  return (
    <table className={styles.table} dir="ltr">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column}>{column}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            {columns.map((column) => (
              <td key={column}>{String(row[column])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
