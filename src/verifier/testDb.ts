import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js'

const require = createRequire(import.meta.url)

let SQL: SqlJsStatic | null = null

export async function createTestDatabase(): Promise<Database> {
  if (!SQL) {
    const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm')
    const buffer = readFileSync(wasmPath)
    const wasmBinary = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    SQL = await initSqlJs({ wasmBinary })
  }
  return new SQL.Database()
}
