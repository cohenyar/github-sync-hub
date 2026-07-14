import { PROGRESSION_CONTENT_REQUIRED_STRING_FIELDS } from '../schemas/progressionContentSchema'
import type { GameProgressionContent } from '../types/gameProgressionContent'
import { fail, ok, requireStringFields, type ValidationResult } from './validationResult'

export function validateProgressionContent(content: GameProgressionContent): ValidationResult {
  const stringFields = requireStringFields(content, PROGRESSION_CONTENT_REQUIRED_STRING_FIELDS)
  const orderErrors =
    typeof content.order === 'number' && Number.isFinite(content.order) ? [] : ['order must be a number']

  const errors = [...stringFields.errors, ...orderErrors]
  return errors.length > 0 ? fail(errors) : ok()
}
