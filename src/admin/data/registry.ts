import type { AdminSection } from '../types'
import { getDistrictItems } from './districts'
import { getMissionItems } from './missions'
import { getNpcItems } from './npcs'
import { getPlayerStateItems } from './playerState'
import { getProgressionItems } from './progression'
import { getRewardItems } from './rewards'

/**
 * The Admin registry: one entry per section. Every section here is a
 * projection of data that already exists elsewhere in the app — there is
 * no separate admin data store to keep in sync. A function, not a static
 * array: missions and NPCs are now mutable at runtime (Admin CRUD, Step
 * 27), so itemCount must be computed fresh on every call rather than
 * frozen at module load.
 */
export function getAdminRegistry(): AdminSection[] {
  return [
    {
      id: 'missions',
      title: 'Missions',
      description: 'All missions currently registered in the game.',
      itemCount: getMissionItems().length,
      status: 'Read-only foundation',
    },
    {
      id: 'districts',
      title: 'Districts',
      description: 'The districts that make up the Meridian world map.',
      itemCount: getDistrictItems().length,
      status: 'Read-only foundation',
    },
    {
      id: 'npcs',
      title: 'NPCs',
      description: "Non-player characters distributed across Meridian's districts.",
      itemCount: getNpcItems().length,
      status: 'CRUD enabled',
    },
    {
      id: 'rewards',
      title: 'Rewards',
      description: 'World effects granted on mission completion.',
      itemCount: getRewardItems().length,
      status: 'Read-only foundation',
    },
    {
      id: 'progression',
      title: 'Progression',
      description: 'The mission order players are expected to progress through.',
      itemCount: getProgressionItems().length,
      status: 'Read-only foundation',
    },
    {
      id: 'player-state',
      title: 'Player State',
      description: 'Persisted player progress. No save/load system exists yet.',
      itemCount: getPlayerStateItems().length,
      status: 'Read-only foundation',
    },
  ]
}
