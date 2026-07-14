import { validateNpcContent } from '../../gameContent'
import { addNpc, getNpcById, removeNpc, updateNpc, type NpcConfig } from '../../npcs'
import { initialDistricts } from '../../worldState'
import { toAdminMutationResult, type AdminMutationResult } from './adminMutationResult'

/**
 * The fields Admin CRUD authors directly. unlockConditions is deliberately
 * not exposed here — that's the Unlock Engine's concern, and this step
 * only manages content. updateNpc's shallow merge means editing through
 * this service never touches (or drops) unlockConditions on an existing NPC.
 */
export interface NpcDraft {
  id: string
  name: string
  districtId: string
  role: string
  description: string
}

function validateDraft(draft: NpcDraft): string[] {
  const errors = [...validateNpcContent(draft).errors]
  if (draft.districtId.length > 0 && !initialDistricts.some((district) => district.id === draft.districtId)) {
    errors.push(`districtId must be one of: ${initialDistricts.map((district) => district.id).join(', ')}`)
  }
  return errors
}

export function createNpc(draft: NpcDraft): AdminMutationResult {
  const errors = validateDraft(draft)
  if (errors.length > 0) return { success: false, errors }

  const npc: NpcConfig = { ...draft }
  return toAdminMutationResult(() => addNpc(npc))
}

export function editNpc(id: string, draft: Omit<NpcDraft, 'id'>): AdminMutationResult {
  const errors = validateDraft({ ...draft, id })
  if (errors.length > 0) return { success: false, errors }

  return toAdminMutationResult(() => updateNpc(id, draft))
}

export function deleteNpc(id: string): AdminMutationResult {
  return toAdminMutationResult(() => removeNpc(id))
}

export function getNpcDraft(id: string): NpcDraft | undefined {
  const npc = getNpcById(id)
  if (!npc) return undefined
  const { id: npcId, name, districtId, role, description } = npc
  return { id: npcId, name, districtId, role, description }
}
