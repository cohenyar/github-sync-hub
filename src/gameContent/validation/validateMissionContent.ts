import { MISSION_CONTENT_REQUIRED_FIELDS } from '../schemas/missionContentSchema'
import type { GameMissionContent } from '../types/gameMissionContent'
import { requireStringFields, type ValidationResult } from './validationResult'

export function validateMissionContent(content: GameMissionContent): ValidationResult {
  return requireStringFields(content, MISSION_CONTENT_REQUIRED_FIELDS)
}
