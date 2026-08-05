/**
 * Meridian 1.4 — Player Identity MVP. Same shape and purpose as
 * npcAppearance.ts's NPC_APPEARANCE table, pointed at the player instead:
 * a small, fixed set of color recipes, chosen at Profile Creation and
 * persisted as PlayerProgress.playerAvatarId. No new art pipeline, no 3D
 * customization tooling — exactly the trick every NPC already uses.
 *
 * Every body/accent pair here is deliberately more saturated than any
 * NPC_APPEARANCE entry, preserving PlayerAvatar.tsx's own stated invariant
 * ("the player's silhouette is exclusive by construction... none is this
 * saturated a color") across every preset, not just the default one.
 *
 * Game Feel pass — the player is now a real jointed figure (PlayerCharacter),
 * not a capsule, so each preset needs a few more colors: skin/hair/eyebrows
 * stay one shared, human-passing default across every preset (avatarId is a
 * favorite-color pick, not an identity pick — it shouldn't also change skin
 * tone), while pants/shoes are derived from each preset's own bodyColor so
 * the outfit still reads as "that preset's color," just in two values. This
 * is deliberately not a character creator: there is still exactly one knob
 * (avatarId), just a fuller recipe behind it.
 */
export interface PlayerAvatarPreset {
  id: string
  label: string
  bodyColor: string
  accentColor: string
  skinTone: string
  hairColor: string
  eyebrowColor: string
  pantsColor: string
  shoeColor: string
}

const SHARED_SKIN_TONE = '#e8b48a'
const SHARED_HAIR_COLOR = '#2a2018'

/** Multiplies each RGB channel toward black — used to derive pants/shoes from a preset's own bodyColor. */
function darkenHex(hex: string, amount: number): string {
  const value = Number.parseInt(hex.slice(1), 16)
  const channel = (shift: number) => {
    const component = (value >> shift) & 0xff
    return Math.round(component * (1 - amount))
      .toString(16)
      .padStart(2, '0')
  }
  return `#${channel(16)}${channel(8)}${channel(0)}`
}

interface PlayerAvatarRecipe {
  id: string
  label: string
  bodyColor: string
  accentColor: string
}

/**
 * 'ember' is first and is the default for any save with no playerAvatarId
 * yet (a pre-1.4 save, or a fresh one before Profile Creation runs) — it is
 * PlayerAvatar.tsx's own original, unchanged colors, so an existing save's
 * avatar never visibly changes just because this feature shipped.
 */
const PLAYER_AVATAR_RECIPES: readonly PlayerAvatarRecipe[] = [
  { id: 'ember', label: 'ענבר', bodyColor: '#ff7530', accentColor: '#ffd9a0' },
  { id: 'azure', label: 'תכלת', bodyColor: '#3d9dff', accentColor: '#cfe8ff' },
  { id: 'violet', label: 'סגול', bodyColor: '#a94dff', accentColor: '#e6cdff' },
  { id: 'verdant', label: 'ירוק', bodyColor: '#33d17a', accentColor: '#c8ffe0' },
  { id: 'crimson', label: 'אדום', bodyColor: '#ff4d6a', accentColor: '#ffd0da' },
  { id: 'cyan', label: 'ציאן', bodyColor: '#22e0d6', accentColor: '#c8fff9' },
]

export const PLAYER_AVATAR_PRESETS: readonly PlayerAvatarPreset[] = PLAYER_AVATAR_RECIPES.map((recipe) => ({
  ...recipe,
  skinTone: SHARED_SKIN_TONE,
  hairColor: SHARED_HAIR_COLOR,
  eyebrowColor: SHARED_HAIR_COLOR,
  pantsColor: darkenHex(recipe.bodyColor, 0.45),
  shoeColor: darkenHex(recipe.bodyColor, 0.7),
}))

const DEFAULT_PRESET: PlayerAvatarPreset = PLAYER_AVATAR_PRESETS[0]

export function getPlayerAvatarPreset(avatarId?: string): PlayerAvatarPreset {
  return PLAYER_AVATAR_PRESETS.find((preset) => preset.id === avatarId) ?? DEFAULT_PRESET
}
