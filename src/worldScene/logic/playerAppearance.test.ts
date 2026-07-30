import { describe, expect, it } from 'vitest'
import { getNpcAppearance } from './npcAppearance'
import { getPlayerAvatarPreset, PLAYER_AVATAR_PRESETS } from './playerAppearance'

const HEX_COLOR = /^#[0-9a-f]{6}$/i

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

describe('PLAYER_AVATAR_PRESETS', () => {
  it('has between 4 and 8 presets, each with a real id, label, and hex colors', () => {
    expect(PLAYER_AVATAR_PRESETS.length).toBeGreaterThanOrEqual(4)
    expect(PLAYER_AVATAR_PRESETS.length).toBeLessThanOrEqual(8)
    for (const preset of PLAYER_AVATAR_PRESETS) {
      expect(preset.id.length).toBeGreaterThan(0)
      expect(preset.label.length).toBeGreaterThan(0)
      expect(preset.bodyColor).toMatch(HEX_COLOR)
      expect(preset.accentColor).toMatch(HEX_COLOR)
    }
  })

  it('gives every preset a unique id and a unique body color', () => {
    const ids = PLAYER_AVATAR_PRESETS.map((preset) => preset.id)
    const colors = PLAYER_AVATAR_PRESETS.map((preset) => preset.bodyColor.toLowerCase())
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(colors).size).toBe(colors.length)
  })

  it('never reuses a real NPC body color for any preset — the player stays visually exclusive', () => {
    const npcColors = new Set(REAL_NPC_IDS.map((npcId) => getNpcAppearance(npcId).bodyColor.toLowerCase()))
    for (const preset of PLAYER_AVATAR_PRESETS) {
      expect(npcColors.has(preset.bodyColor.toLowerCase())).toBe(false)
    }
  })
})

describe('getPlayerAvatarPreset', () => {
  it('resolves a known preset id', () => {
    expect(getPlayerAvatarPreset('azure').id).toBe('azure')
  })

  it("defaults to the first preset ('ember', the original player color) for an unknown or missing id", () => {
    expect(getPlayerAvatarPreset('does-not-exist').id).toBe('ember')
    expect(getPlayerAvatarPreset(undefined).id).toBe('ember')
    expect(getPlayerAvatarPreset(undefined).bodyColor).toBe('#ff7530')
  })
})
