import type { NpcConfig } from './types'

const npcs: NpcConfig[] = [
  {
    id: 'archivist-mera',
    name: 'Mera Solt',
    districtId: 'core',
    role: 'Archivist',
    description: 'Tends the Records Core, waiting for its signal to steady.',
    roleHe: 'ארכיבאית',
    descriptionHe: 'מטפלת במוקד הרשומות וממתינה שהאות שלו יתייצב.',
  },
  {
    id: 'north-warden',
    name: 'Devrin Kass',
    districtId: 'north',
    role: 'District Warden',
    description: "Keeps watch over North district's loyalty to Meridian.",
    roleHe: 'שומר המחוז',
    descriptionHe: 'שומר על נאמנות מחוז הצפון למרידיאן.',
  },
  {
    id: 'south-organizer',
    name: 'Priya Nandall',
    districtId: 'south',
    role: 'Community Organizer',
    description: 'Works to steady an unstable South district from the ground up.',
    roleHe: 'מארגנת קהילתית',
    descriptionHe: 'פועלת לייצב את מחוז הדרום הלא יציב, מהיסוד.',
  },
  {
    id: 'east-broker',
    name: 'Tomas Reyeth',
    districtId: 'east',
    role: 'Trade Broker',
    description: "East district's thriving trade routes pass through his ledger.",
    unlockConditions: [{ kind: 'missionCompleted', missionId: 'first-contact' }],
    roleHe: 'מתווך סחר',
    descriptionHe: 'נתיבי הסחר המשגשגים של מחוז המזרח עוברים דרך פנקסו.',
  },
  {
    id: 'north-analyst',
    name: 'Joran Petrik',
    districtId: 'north',
    role: 'Signal Analyst',
    description: "Cross-references every district's reports once enough of them start telling the same story.",
    unlockConditions: [{ kind: 'progressionPercentage', minPercentage: 40 }],
    roleHe: 'אנליסט אותות',
    descriptionHe: 'משווה בין דוחות כל המחוזות, ברגע שמספיק מהם מתחילים לספר את אותו הסיפור.',
  },
  {
    id: 'south-engineer',
    name: 'Elin Voss',
    districtId: 'south',
    role: 'Water Engineer',
    description: "Repairs what South's incident reports made visible.",
    unlockConditions: [{ kind: 'missionCompleted', missionId: 'south-stability' }],
    roleHe: 'מהנדסת מים',
    descriptionHe: 'מתקנת את מה שדוחות התקריות של הדרום חשפו.',
  },
  {
    id: 'city-voice',
    name: 'Kestrel Vane',
    districtId: 'core',
    role: 'City Voice',
    description: 'Speaks for Meridian now that every district answers in one voice.',
    unlockConditions: [{ kind: 'campaignCompleted', campaignId: 'meridian-campaign' }],
    roleHe: 'קול העיר',
    descriptionHe: 'הקול שדרכו מרידיאן מדברת, כעת כשכל המחוזות עונים כאחד.',
  },
  // Batch 3A.3 — the two learning-path teachers, stationed outside their
  // own building (see scenePositions3D.ts). districtId is 'core' since
  // both buildings sit in the new Central Plaza, not a separate district —
  // this is what makes them visible via the exact same
  // getVisibleNpcs/proximity mechanism every other NPC already uses.
  {
    id: 'math-teacher',
    name: 'נדב שטרן',
    districtId: 'core',
    role: 'Mathematics Teacher',
    description: 'Teaches the foundations of numbers and problem-solving at the Mathematics Academy.',
    roleHe: 'מורה למתמטיקה',
    descriptionHe: 'מלמד את יסודות המספרים ופתרון הבעיות באקדמיית המתמטיקה.',
  },
  {
    id: 'english-teacher',
    name: 'טליה ריבס',
    districtId: 'core',
    role: 'English Teacher',
    description: 'Teaches English vocabulary and language skills at the English Language Center.',
    roleHe: 'מורה לאנגלית',
    descriptionHe: 'מלמדת אוצר מילים וכישורי שפה במרכז השפה האנגלית.',
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
