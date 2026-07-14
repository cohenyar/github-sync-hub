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
  'north-warden': { bodyColor: '#2f4966', accentColor: '#8a94a3', glowColor: '#ffb648' },
  'north-analyst': { bodyColor: '#2b8f8f', accentColor: '#1c6b6b', glowColor: '#5be0e0' },
  'south-organizer': { bodyColor: '#d17a52', accentColor: '#f0e6c8', glowColor: '#ffcf8a' },
  'south-engineer': { bodyColor: '#c9a227', accentColor: '#6b7280', glowColor: '#f4c430' },
  'east-broker': { bodyColor: '#d9a441', accentColor: '#5c4a2e', glowColor: '#ffd700' },
  'archivist-mera': { bodyColor: '#5a3d78', accentColor: '#4a2f63', glowColor: '#bfe8ff' },
  'city-voice': { bodyColor: '#e6e6f0', accentColor: '#c9c9d9', glowColor: '#ffe9b0' },
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
