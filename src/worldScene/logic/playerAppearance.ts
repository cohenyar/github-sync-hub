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
 */
export interface PlayerAvatarPreset {
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
export const PLAYER_AVATAR_PRESETS: readonly PlayerAvatarPreset[] = [
  { id: 'ember', label: 'ענבר', bodyColor: '#ff7530', accentColor: '#ffd9a0' },
  { id: 'azure', label: 'תכלת', bodyColor: '#3d9dff', accentColor: '#cfe8ff' },
  { id: 'violet', label: 'סגול', bodyColor: '#a94dff', accentColor: '#e6cdff' },
  { id: 'verdant', label: 'ירוק', bodyColor: '#33d17a', accentColor: '#c8ffe0' },
  { id: 'crimson', label: 'אדום', bodyColor: '#ff4d6a', accentColor: '#ffd0da' },
  { id: 'cyan', label: 'ציאן', bodyColor: '#22e0d6', accentColor: '#c8fff9' },
]

const DEFAULT_PRESET: PlayerAvatarPreset = PLAYER_AVATAR_PRESETS[0]

export function getPlayerAvatarPreset(avatarId?: string): PlayerAvatarPreset {
  return PLAYER_AVATAR_PRESETS.find((preset) => preset.id === avatarId) ?? DEFAULT_PRESET
}
