/**
 * Each NPC's signature colors — the single source of truth both the
 * bespoke character figures (see npcFigures.tsx) and this module's tests
 * read from. Body/accent stay in Meridian's "vivid character against a
 * muted world" palette (buildings and ground are deliberately desaturated;
 * characters are not); glowColor is each character's own small warm
 * accent, tying the whole cast to the Records Core's glow and the plaza's
 * lamplight without making every character glow identically.
 */
export interface NpcAppearance {
  bodyColor: string
  accentColor: string
  glowColor: string
}

const NPC_APPEARANCE: Record<string, NpcAppearance> = {
  // Game Feel pass — brightened from the original #2f4966, same slate-blue
  // hue family: at the fixed camera's distance and the scene's dark
  // ambient/fog, the original read as barely distinguishable from the
  // night background (the same class of issue MathAcademy/EnglishCenter's
  // own Batch 3A.5 pass already found and fixed on their wall colors).
  'north-warden': { bodyColor: '#3a5b7e', accentColor: '#8a94a3', glowColor: '#ffb648' },
  'north-analyst': { bodyColor: '#2b8f8f', accentColor: '#1c6b6b', glowColor: '#5be0e0' },
  'south-organizer': { bodyColor: '#d17a52', accentColor: '#f0e6c8', glowColor: '#ffcf8a' },
  'south-engineer': { bodyColor: '#c9a227', accentColor: '#6b7280', glowColor: '#f4c430' },
  'east-broker': { bodyColor: '#d9a441', accentColor: '#5c4a2e', glowColor: '#ffd700' },
  // Game Feel pass — brightened from the original #5a3d78, same violet hue
  // family: a screenshot showed her silhouette nearly merging with the
  // Records Core building's own similarly dark violet wall (#584a72)
  // standing right behind her.
  'archivist-mera': { bodyColor: '#704c95', accentColor: '#4a2f63', glowColor: '#bfe8ff' },
  'city-voice': { bodyColor: '#e6e6f0', accentColor: '#c9c9d9', glowColor: '#ffe9b0' },
  // Batch 3A.3 — the two teachers, tied to their own building's palette
  // (see MathAcademy.tsx / EnglishCenter.tsx) so the NPC visually belongs
  // to the building they're stationed outside.
  //
  // Game Feel pass — body/accent were still the two buildings' *original*
  // wall/roof colors from before Batch 3A.5 brightened them (MathAcademy's
  // own comment: "brightened from the original #4d5f82/#2f3c56"; English
  // Center's: "brightened from the original #9c7a5a/#7a4f42") — this table
  // was never updated to follow, so each teacher still wore the exact
  // tones already proven too dark against this scene. Now matches their
  // own building's current (brightened) wall/roof colors exactly.
  'math-teacher': { bodyColor: '#5f74a3', accentColor: '#3d4d70', glowColor: '#8fd8ff' },
  'english-teacher': { bodyColor: '#b08a63', accentColor: '#8f5e4c', glowColor: '#e0c9a6' },
  // Meridian 1.3 — warm and bright, matching her already-happy-ending state.
  'reunited-owner': { bodyColor: '#c9906a', accentColor: '#8a5f42', glowColor: '#ffd9a0' },
}

/** A visibly distinct grey for any NPC not in the table yet, rather than dropping their appearance entirely. */
const DEFAULT_APPEARANCE: NpcAppearance = {
  bodyColor: '#7f8a9a',
  accentColor: '#5f6a78',
  glowColor: '#ffe9b0',
}

export function getNpcAppearance(npcId: string): NpcAppearance {
  return NPC_APPEARANCE[npcId] ?? DEFAULT_APPEARANCE
}
