import { he } from '../../i18n'
import { getNpcsByDistrict, type NpcConfig } from '../../npcs'
import type { EntityId } from '../../types/engine'
import type { DistrictStatus } from '../../worldState'

/** Only NPCs both assigned to this district and unlocked for the player are ever shown — same rule District.tsx already applies. */
export function getVisibleNpcs(districtId: EntityId, unlockedNpcIds: readonly string[]): readonly NpcConfig[] {
  return getNpcsByDistrict(districtId).filter((npc) => unlockedNpcIds.includes(npc.id))
}

const DISTRICT_STATUS_LABEL: Record<DistrictStatus, string> = {
  thriving: he.districtThriving,
  stable: he.districtStable,
  unstable: he.districtUnstable,
}

export function getDistrictStatusLabel(status: DistrictStatus): string {
  return DISTRICT_STATUS_LABEL[status]
}

/**
 * Matches DistrictMarker's STATUS_COLOR values exactly (kept as a separate
 * constant rather than a shared import, since one lives in 3D-scene
 * presentation and the other in plain DOM presentation) — the same status
 * always reads as the same color everywhere the player sees it, including
 * the Terminal's ambient framing (see TerminalView) and its entry/exit
 * transition (see CoreTransitionOverlay).
 */
const DISTRICT_STATUS_COLOR: Record<DistrictStatus, string> = {
  thriving: '#43e5d6',
  stable: '#5b8cff',
  unstable: '#8394ad',
}

export function getDistrictStatusColor(status: DistrictStatus): string {
  return DISTRICT_STATUS_COLOR[status]
}
