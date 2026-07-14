import { DISTRICT_CONTENT_REQUIRED_FIELDS } from '../schemas/districtContentSchema'
import type { GameDistrictContent } from '../types/gameDistrictContent'
import { fail, ok, requireStringFields, type ValidationResult } from './validationResult'

export function validateDistrictContent(content: GameDistrictContent): ValidationResult {
  const errors = requireStringFields(content, DISTRICT_CONTENT_REQUIRED_FIELDS).errors

  if (typeof content.stats !== 'object' || content.stats === null || Array.isArray(content.stats)) {
    errors.push('stats must be an object')
  } else {
    for (const [key, value] of Object.entries(content.stats)) {
      if (typeof value !== 'number') {
        errors.push(`stats.${key} must be a number`)
      }
    }
  }

  return errors.length > 0 ? fail(errors) : ok()
}
