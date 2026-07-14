import type { PlayerProgress } from '../../progression'
import type { WorldState } from '../../worldState'

/**
 * The full on-disk shape of a save. version lets a future format change be
 * detected and rejected (as an incompatible save) without needing a
 * migration engine today.
 */
export interface SaveGame {
  version: number
  world: WorldState
  playerProgress: PlayerProgress
}
