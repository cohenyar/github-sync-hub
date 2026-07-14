import { missionRegistry } from '../../missions'
import type { WorldEffect } from '../../worldState'
import type { GameRewardContent } from '../types/gameRewardContent'

/** A reward is the WorldEffect a mission grants on completion (see missions/firstContact.ts). */
export function getRewardContent(): GameRewardContent[] {
  return missionRegistry
    .filter((mission): mission is typeof mission & { successEffect: WorldEffect } => Boolean(mission.successEffect))
    .map((mission) => ({
      missionId: mission.id,
      missionTitle: mission.title,
      effect: mission.successEffect,
    }))
}
