import type { CourseNpcConfig } from './types'

/**
 * Section 4/10 of the final-polish brief: every course can have an
 * associated course NPC, and a brand-new course should start with a
 * sensible default appearance instead of an empty/AI-generated one. This is
 * the "small set of deterministic presets" referenced there — the same
 * trick src/worldScene/logic/playerAppearance.ts uses for the player avatar
 * (a fixed recipe table, one picked by a stable key), just keyed off the
 * course id instead of a player-chosen avatarId.
 *
 * Deliberately no Math.random()/Date.now() anywhere in this module: the
 * whole point is that generateDefaultNpcConfig(course) is a pure function
 * of course.id, so re-opening the edit form for the same course (before the
 * admin ever saves an override) always reproduces the exact same default.
 */

interface NpcPresetRecipe {
  bodyColor: string
  skinTone: string
  hairColor: string
  hairStyle: CourseNpcConfig['hairStyle']
  shirtColor: string
  pantsColor: string
}

const NPC_PRESET_RECIPES: readonly NpcPresetRecipe[] = [
  {
    bodyColor: '#c9955a',
    skinTone: '#e8b48a',
    hairColor: '#2a2018',
    hairStyle: 'short',
    shirtColor: '#3d6b8a',
    pantsColor: '#2b3a4a',
  },
  {
    bodyColor: '#d9a066',
    skinTone: '#f0c9a0',
    hairColor: '#5c3a21',
    hairStyle: 'long',
    shirtColor: '#7a3d5c',
    pantsColor: '#3a2b3a',
  },
  {
    bodyColor: '#b97a52',
    skinTone: '#d9a878',
    hairColor: '#1a1a1a',
    hairStyle: 'bald',
    shirtColor: '#4a7a4a',
    pantsColor: '#2a3a2a',
  },
  {
    bodyColor: '#e0b080',
    skinTone: '#f5d5ab',
    hairColor: '#8a5a2a',
    hairStyle: 'bun',
    shirtColor: '#8a6a2a',
    pantsColor: '#4a3a1a',
  },
  {
    bodyColor: '#a8734f',
    skinTone: '#dab48f',
    hairColor: '#3a2a1a',
    hairStyle: 'short',
    shirtColor: '#5a3a7a',
    pantsColor: '#2a2a3a',
  },
]

const DEFAULT_DISPLAY_NAME = 'Course Guide'
const DEFAULT_ROLE = 'Course Guide'

/** Simple char-code-sum hash, stable across calls/processes — no crypto, no randomness, just deterministic bucketing into the preset table. */
function hashStringToIndex(value: string, modulo: number): number {
  let sum = 0
  for (let index = 0; index < value.length; index += 1) {
    sum += value.charCodeAt(index)
  }
  return sum % modulo
}

/**
 * Pure and deterministic: the same course id always yields the exact same
 * config. title/subject are accepted for a richer hash key later but are
 * not required to vary the result today — only `id` (the one value that's
 * actually stable and unique per course) drives the preset pick.
 */
export function generateDefaultNpcConfig(course: { id: string; title: string; subject: string }): CourseNpcConfig {
  const preset = NPC_PRESET_RECIPES[hashStringToIndex(course.id, NPC_PRESET_RECIPES.length)]
  return {
    displayName: DEFAULT_DISPLAY_NAME,
    role: DEFAULT_ROLE,
    bodyColor: preset.bodyColor,
    skinTone: preset.skinTone,
    hairColor: preset.hairColor,
    hairStyle: preset.hairStyle,
    shirtColor: preset.shirtColor,
    pantsColor: preset.pantsColor,
  }
}
