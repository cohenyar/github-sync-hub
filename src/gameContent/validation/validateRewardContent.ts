import { REWARD_CONTENT_REQUIRED_STRING_FIELDS } from '../schemas/rewardContentSchema'
import type { GameRewardContent } from '../types/gameRewardContent'
import { combine, requireStringFields, type ValidationResult } from './validationResult'
import { validateWorldEffectContent } from './validateWorldEffectContent'

export function validateRewardContent(content: GameRewardContent): ValidationResult {
  return combine([
    requireStringFields(content, REWARD_CONTENT_REQUIRED_STRING_FIELDS),
    validateWorldEffectContent(content.effect),
  ])
}
