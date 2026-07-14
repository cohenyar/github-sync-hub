import { VALID_WORLD_EFFECT_KINDS } from '../schemas/worldEffectContentSchema'
import type { GameWorldEffectContent } from '../types/gameWorldEffectContent'
import { fail, ok, requireNonEmptyString, type ValidationResult } from './validationResult'

export function validateWorldEffectContent(effect: GameWorldEffectContent): ValidationResult {
  if (!effect || typeof effect !== 'object' || !('kind' in effect)) {
    return fail(['effect must be an object with a kind'])
  }

  const errors: string[] = []

  if (!(VALID_WORLD_EFFECT_KINDS as readonly string[]).includes(effect.kind)) {
    errors.push(`effect.kind must be one of ${VALID_WORLD_EFFECT_KINDS.join(', ')}`)
  }

  if (effect.kind === 'ADJUST_STAT' || effect.kind === 'SET_STAT') {
    errors.push(...requireNonEmptyString(effect.districtId, 'effect.districtId'))
    errors.push(...requireNonEmptyString(effect.stat, 'effect.stat'))
  }

  return errors.length > 0 ? fail(errors) : ok()
}
