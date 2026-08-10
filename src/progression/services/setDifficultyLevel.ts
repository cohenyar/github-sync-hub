import type { DifficultyLevel, PlayerProgress } from '../types'

/**
 * First Mission UX pass. Sets the local profile's learning difficulty —
 * scaffolding/help only, never a different campaign. Deliberately touches no
 * other field: same missions, same progression order, same unlock rules,
 * same story either way (see getDifficultyLevel for the read side).
 */
export function setDifficultyLevel(progress: PlayerProgress, level: DifficultyLevel): PlayerProgress {
  return { ...progress, difficultyLevel: level }
}
