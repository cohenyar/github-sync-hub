import type { PlayerProgress } from '../../progression'
import type { WorldState } from '../../worldState'
import type { SaveGame } from '../types'

export const CURRENT_SAVE_VERSION = 1

export function serializeSaveGame(data: { world: WorldState; playerProgress: PlayerProgress }): string {
  const saveGame: SaveGame = { version: CURRENT_SAVE_VERSION, world: data.world, playerProgress: data.playerProgress }
  return JSON.stringify(saveGame)
}
