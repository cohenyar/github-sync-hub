import { NPC_CONTENT_REQUIRED_FIELDS } from '../schemas/npcContentSchema'
import type { GameNpcContent } from '../types/gameNpcContent'
import { requireStringFields, type ValidationResult } from './validationResult'

export function validateNpcContent(content: GameNpcContent): ValidationResult {
  return requireStringFields(content, NPC_CONTENT_REQUIRED_FIELDS)
}
