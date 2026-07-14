import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js'
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import seedSql from './seed.sql?raw'

let SQL: SqlJsStatic | null = null
let db: Database | null = null

async function loadSql(): Promise<SqlJsStatic> {
  if (!SQL) {
    SQL = await initSqlJs({ locateFile: () => sqlWasmUrl })
  }
  return SQL
}

export async function createDatabase(): Promise<Database> {
  const sql = await loadSql()
  return new sql.Database()
}

export async function initDatabase(): Promise<Database> {
  if (db) return db

  db = await createDatabase()

  if (seedSql.trim().length > 0) {
    db.run(seedSql)
  }

  return db
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database has not been initialized. Call initDatabase() first.')
  }
  return db
}
