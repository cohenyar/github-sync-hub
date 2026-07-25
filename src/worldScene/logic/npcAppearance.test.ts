import { describe, expect, it } from 'vitest'
import { getNpcAppearance } from './npcAppearance'

const PLAYER_AVATAR_COLOR = '#ff7530'

const REAL_NPC_IDS = [
  'archivist-mera',
  'north-warden',
  'north-analyst',
  'south-organizer',
  'south-engineer',
  'east-broker',
  'city-voice',
  'math-teacher',
  'english-teacher',
]

const HEX_COLOR = /^#[0-9a-f]{6}$/i

describe('getNpcAppearance', () => {
  it('gives every real NPC hex body, accent, and glow colors', () => {
    for (const npcId of REAL_NPC_IDS) {
      const appearance = getNpcAppearance(npcId)
      expect(appearance.bodyColor).toMatch(HEX_COLOR)
      expect(appearance.accentColor).toMatch(HEX_COLOR)
      expect(appearance.glowColor).toMatch(HEX_COLOR)
    }
  })

  it("never assigns the player avatar's color to any NPC's body", () => {
    for (const npcId of REAL_NPC_IDS) {
      expect(getNpcAppearance(npcId).bodyColor.toLowerCase()).not.toBe(PLAYER_AVATAR_COLOR)
    }
  })

  it('gives every real NPC a unique body color', () => {
    const colors = REAL_NPC_IDS.map((npcId) => getNpcAppearance(npcId).bodyColor.toLowerCase())
    expect(new Set(colors).size).toBe(colors.length)
  })

  it('falls back to a default appearance for an unknown NPC id, rather than throwing', () => {
    expect(() => getNpcAppearance('does-not-exist')).not.toThrow()
    const fallback = getNpcAppearance('does-not-exist')
    expect(fallback.bodyColor).toMatch(HEX_COLOR)
    expect(fallback.bodyColor.toLowerCase()).not.toBe(PLAYER_AVATAR_COLOR)
  })
})
