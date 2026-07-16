import { he } from '../i18n'
import { getMissionById } from '../missions'
import { getNpcById } from '../npcs'
import type { OdinNarrationEntry } from '../odin'
import type { GameEventBannerModel } from './GameEventBanner'

/**
 * Presentation-only name resolution for notification detail lines. Reads the
 * existing mission / NPC registries to turn an internal id into the real
 * player-facing name, falling back to the raw id when it can't be resolved.
 * These are read-only lookups — no event payload, id, or gameplay data is
 * changed.
 */
function missionName(missionId: string): string {
  return getMissionById(missionId)?.title ?? missionId
}
function npcName(npcId: string): string {
  return getNpcById(npcId)?.name ?? npcId
}

/**
 * Maps an existing structured GameEvent (carried on every Odin narration
 * entry — see odin/types) to a banner model. This is the presentation-only
 * bridge described in the plan: no new event system, no new subscription.
 * Only the event types that carry a meaningful "something happened" beat are
 * surfaced; anything else returns null and no banner shows.
 */
export function bannerFromOdinEntry(entry: OdinNarrationEntry | null): GameEventBannerModel | null {
  if (!entry) return null
  const { event } = entry
  const key = `odin-${entry.id}`

  switch (event.type) {
    case 'MissionCompleted':
      return { key, tone: 'success', icon: '✓', title: he.eventMissionCompleted, detail: missionName(event.missionId), detailDir: 'ltr' }
    case 'CampaignCompleted':
      return { key, tone: 'success', icon: '★', title: he.eventCampaignCompleted }
    case 'ContentUnlocked': {
      if (event.target.type === 'npc') {
        return { key, tone: 'ai', icon: '☺', title: he.eventNpcUnlocked, detail: npcName(event.target.id), detailDir: 'ltr' }
      }
      if (event.target.type === 'district') {
        // District-unlock events don't fire in the current campaign; leave the
        // detail as the raw id (world-map labels are handled separately).
        return { key, tone: 'info', icon: '◈', title: he.eventDistrictUnlocked, detail: event.target.id, detailDir: 'ltr' }
      }
      return { key, tone: 'info', icon: '◆', title: he.eventMissionUnlocked, detail: missionName(event.target.id), detailDir: 'ltr' }
    }
    case 'QueryFailed':
      return { key, tone: 'warning', icon: '!', title: he.eventQueryFailed }
    // MissionStarted / WorldStateChanged carry no distinct "just happened"
    // beat worth a banner — deliberately not surfaced.
    default:
      return null
  }
}

/** Save/Load are pure UI flags GameApp already owns; these build their banners. */
export function saveBanner(nonce: number): GameEventBannerModel {
  return { key: `save-${nonce}`, tone: 'success', icon: '💾', title: he.eventSaveSuccess }
}

export function loadBanner(nonce: number): GameEventBannerModel {
  return { key: `load-${nonce}`, tone: 'info', icon: '📂', title: he.eventLoadSuccess }
}
