import type { SaveGame } from '../types'
import { CURRENT_SAVE_VERSION } from './serializeSaveGame'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isValidWorld(value: unknown): boolean {
  return isRecord(value) && typeof value.turn === 'number' && isRecord(value.districts)
}

function isValidPlayerProgress(value: unknown): boolean {
  return (
    isRecord(value) &&
    Array.isArray(value.completedMissionIds) &&
    Array.isArray(value.completions) &&
    isRecord(value.unlockState) &&
    isRecord(value.campaignProgress)
  )
}

function isValidSaveGame(value: unknown): value is SaveGame {
  return (
    isRecord(value) &&
    value.version === CURRENT_SAVE_VERSION &&
    isValidWorld(value.world) &&
    isValidPlayerProgress(value.playerProgress)
  )
}

/** Returns null for malformed JSON, an unrecognized shape, or a version mismatch. */
export function deserializeSaveGame(json: string): SaveGame | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return null
  }
  return isValidSaveGame(parsed) ? parsed : null
}
