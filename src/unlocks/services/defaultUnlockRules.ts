import { missionRegistry } from '../../missions'
import { npcRegistry } from '../../npcs'
import { initialDistricts } from '../../worldState'
import type { UnlockCondition, UnlockRule } from '../types'

/**
 * Per-mission unlock conditions, keyed by mission id. Missions don't know
 * about the Unlock Engine (that would invert the dependency — unlocks is
 * a system built on top of mission ids, not the other way around), so
 * gating lives here as data. A mission with no entry defaults to "always"
 * unlocked, matching the very first mission's behavior. This is exactly
 * the "data change here, not an engine change" the engine was built for.
 */
const MISSION_UNLOCK_CONDITIONS: Record<string, readonly UnlockCondition[]> = {
  'district-ties': [{ kind: 'missionCompleted', missionId: 'first-contact' }],
  'south-stability': [{ kind: 'missionCompleted', missionId: 'district-ties' }],
  'full-signal': [{ kind: 'missionCompleted', missionId: 'south-stability' }],
  'linked-records': [{ kind: 'missionCompleted', missionId: 'full-signal' }],
  'priority-signal': [{ kind: 'missionCompleted', missionId: 'linked-records' }],
}

export const defaultUnlockRules: UnlockRule[] = [
  ...missionRegistry.map(
    (mission): UnlockRule => ({
      target: { type: 'mission', id: mission.id },
      conditions: MISSION_UNLOCK_CONDITIONS[mission.id] ?? [{ kind: 'always' }],
    }),
  ),
  ...initialDistricts.map(
    (district): UnlockRule => ({
      target: { type: 'district', id: district.id },
      conditions: [{ kind: 'always' }],
    }),
  ),
  // NPCs carry their own unlockConditions (optional — absent means always
  // unlocked), unlike missions, since there's no risk of a circular import:
  // NpcConfig only references the UnlockCondition type, never a value.
  ...npcRegistry.map(
    (npc): UnlockRule => ({
      target: { type: 'npc', id: npc.id },
      conditions: npc.unlockConditions ?? [{ kind: 'always' }],
    }),
  ),
]
