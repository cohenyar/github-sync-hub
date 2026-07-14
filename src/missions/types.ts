import type { VerifyOptions } from '../verifier'
import type { WorldEffect } from '../worldState'

export interface MissionConfig {
  id: string
  title: string
  goal: string
  prompt: string
  setupSql: string
  referenceSql: string
  verifyOptions?: VerifyOptions
  /** Applied to the WorldState exactly once, only when the Verifier reports a pass. */
  successEffect?: WorldEffect
}
