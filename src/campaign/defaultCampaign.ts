import { missionRegistry } from '../missions'
import type { GameCampaign } from './types'

/**
 * The default campaign: every registered mission, in registry order. With
 * only one mission registered today this behaves as a single-mission game;
 * adding a second mission to missionRegistry is enough to grow the campaign
 * without touching this file or the runtime that plays missions.
 */
export const defaultCampaign: GameCampaign = {
  id: 'meridian-campaign',
  title: 'Meridian Campaign',
  missions: missionRegistry.map((mission, index) => ({ order: index + 1, missionId: mission.id })),
}
