import type { NpcConfig } from './types'

const npcs: NpcConfig[] = [
  {
    id: 'archivist-mera',
    name: 'Mera Solt',
    districtId: 'core',
    role: 'Archivist',
    description: 'Tends the Records Core, waiting for its signal to steady.',
  },
  {
    id: 'north-warden',
    name: 'Devrin Kass',
    districtId: 'north',
    role: 'District Warden',
    description: "Keeps watch over North district's loyalty to Meridian.",
  },
  {
    id: 'south-organizer',
    name: 'Priya Nandall',
    districtId: 'south',
    role: 'Community Organizer',
    description: 'Works to steady an unstable South district from the ground up.',
  },
  {
    id: 'east-broker',
    name: 'Tomas Reyeth',
    districtId: 'east',
    role: 'Trade Broker',
    description: "East district's thriving trade routes pass through his ledger.",
    unlockConditions: [{ kind: 'missionCompleted', missionId: 'first-contact' }],
  },
  {
    id: 'north-analyst',
    name: 'Joran Petrik',
    districtId: 'north',
    role: 'Signal Analyst',
    description: "Cross-references every district's reports once enough of them start telling the same story.",
    unlockConditions: [{ kind: 'progressionPercentage', minPercentage: 40 }],
  },
  {
    id: 'south-engineer',
    name: 'Elin Voss',
    districtId: 'south',
    role: 'Water Engineer',
    description: "Repairs what South's incident reports made visible.",
    unlockConditions: [{ kind: 'missionCompleted', missionId: 'south-stability' }],
  },
  {
    id: 'city-voice',
    name: 'Kestrel Vane',
    districtId: 'core',
    role: 'City Voice',
    description: 'Speaks for Meridian now that every district answers in one voice.',
    unlockConditions: [{ kind: 'campaignCompleted', campaignId: 'meridian-campaign' }],
  },
]

/**
 * The NPC registry is the single, data-driven list of NPCs the app knows
 * about — one per district, matching the mission registry's pattern.
 * Content only: no dialogue, no behavior, no AI. unlockConditions (where
 * present) are evaluated by the existing Unlock Engine, same as missions.
 *
 * Exposed as read-only; addNpc/updateNpc/removeNpc below are the only
 * sanctioned way to mutate the underlying list (Admin CRUD, Step 27) — they
 * mutate this exact array, not a copy, so every existing reader sees edits.
 */
export const npcRegistry: readonly NpcConfig[] = npcs

export function addNpc(npc: NpcConfig): void {
  if (npcs.some((existing) => existing.id === npc.id)) {
    throw new Error(`NPC id "${npc.id}" already exists.`)
  }
  npcs.push(npc)
}

/**
 * Shallow-merges updates onto the existing NPC so fields the caller doesn't
 * touch — notably unlockConditions, which Admin's edit form does not
 * author — are preserved rather than dropped.
 */
export function updateNpc(id: string, updates: Partial<Omit<NpcConfig, 'id'>>): NpcConfig {
  const index = npcs.findIndex((npc) => npc.id === id)
  if (index === -1) {
    throw new Error(`NPC id "${id}" does not exist.`)
  }
  const updated = { ...npcs[index], ...updates }
  npcs[index] = updated
  return updated
}

export function removeNpc(id: string): void {
  const index = npcs.findIndex((npc) => npc.id === id)
  if (index === -1) {
    throw new Error(`NPC id "${id}" does not exist.`)
  }
  npcs.splice(index, 1)
}
