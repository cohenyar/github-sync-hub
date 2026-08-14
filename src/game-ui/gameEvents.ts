import { he } from '../i18n'
import { getMissionById, getMissionDisplayText } from '../missions'
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
function missionDetail(missionId: string): { text: string; dir: 'ltr' | 'rtl' } {
  const mission = getMissionById(missionId)
  if (!mission) return { text: missionId, dir: 'ltr' }
  return { text: getMissionDisplayText(mission).title, dir: mission.titleHe ? 'rtl' : 'ltr' }
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
    case 'MissionCompleted': {
      const { text, dir } = missionDetail(event.missionId)
      return { key, tone: 'success', icon: '✓', title: he.eventMissionCompleted, detail: text, detailDir: dir }
    }
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
      const { text, dir } = missionDetail(event.target.id)
      return { key, tone: 'info', icon: '◆', title: he.eventMissionUnlocked, detail: text, detailDir: dir }
    }
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
