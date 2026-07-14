import { validateMissionContent } from '../../gameContent'
import { addMission, getMissionById, removeMission, updateMission, type MissionConfig } from '../../missions'
import { toAdminMutationResult, type AdminMutationResult } from './adminMutationResult'

/**
 * The fields Admin CRUD authors directly. successEffect and verifyOptions
 * are deliberately not exposed here — they drive WorldState/verification
 * behavior, and this step only manages content, not gameplay systems.
 * updateMission's shallow merge means editing through this service never
 * touches (or drops) those fields on an existing mission.
 */
export interface MissionDraft {
  id: string
  title: string
  goal: string
  prompt: string
  setupSql: string
  referenceSql: string
}

function validateDraft(draft: MissionDraft): string[] {
  const errors = [...validateMissionContent(draft).errors]
  if (draft.setupSql.trim().length === 0) {
    errors.push('setupSql must be a non-empty string')
  }
  return errors
}

export function createMission(draft: MissionDraft): AdminMutationResult {
  const errors = validateDraft(draft)
  if (errors.length > 0) return { success: false, errors }

  const mission: MissionConfig = { ...draft }
  return toAdminMutationResult(() => addMission(mission))
}

export function editMission(id: string, draft: Omit<MissionDraft, 'id'>): AdminMutationResult {
  const errors = validateDraft({ ...draft, id })
  if (errors.length > 0) return { success: false, errors }

  return toAdminMutationResult(() => updateMission(id, draft))
}

export function deleteMission(id: string): AdminMutationResult {
  return toAdminMutationResult(() => removeMission(id))
}

export function getMissionDraft(id: string): MissionDraft | undefined {
  const mission = getMissionById(id)
  if (!mission) return undefined
  const { id: missionId, title, goal, prompt, setupSql, referenceSql } = mission
  return { id: missionId, title, goal, prompt, setupSql, referenceSql }
}
