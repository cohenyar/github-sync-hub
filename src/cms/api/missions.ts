import type { Json } from '../../integrations/supabase/types'
import type { CmsResult, Mission, MissionAnswerConfig, MissionInput } from '../types'
import { getCmsClient, toCmsError, unavailableResult } from './shared'

function parseAnswerConfig(value: Json | null): MissionAnswerConfig | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const type = (value as { type?: unknown }).type
  if (type === 'exact_text' || type === 'multiple_choice') return value as unknown as MissionAnswerConfig
  return null
}

function fromRow(row: {
  id: string
  lesson_id: string
  title: string
  objective: string
  instructions: string | null
  task: string | null
  answer_config: Json | null
  hint: string | null
  guidance_level_1: string | null
  guidance_level_2: string | null
  guidance_level_3: string | null
  display_order: number
  status: string
  created_at: string
  updated_at: string
}): Mission {
  return {
    id: row.id,
    lessonId: row.lesson_id,
    title: row.title,
    objective: row.objective,
    instructions: row.instructions,
    task: row.task,
    answerConfig: parseAnswerConfig(row.answer_config),
    hint: row.hint,
    guidanceLevel1: row.guidance_level_1,
    guidanceLevel2: row.guidance_level_2,
    guidanceLevel3: row.guidance_level_3,
    status: row.status === 'active' ? 'active' : 'draft',
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toRow(input: MissionInput) {
  return {
    lesson_id: input.lessonId,
    title: input.title,
    objective: input.objective,
    instructions: input.instructions,
    task: input.task,
    answer_config: input.answerConfig as unknown as Json | null,
    hint: input.hint,
    guidance_level_1: input.guidanceLevel1,
    guidance_level_2: input.guidanceLevel2,
    guidance_level_3: input.guidanceLevel3,
    status: input.status,
    display_order: input.displayOrder,
  }
}

export async function listMissions(lessonId: string): Promise<CmsResult<Mission[]>> {
  const client = await getCmsClient()
  if (!client) return unavailableResult()
  const { data, error } = await client
    .from('missions')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('display_order', { ascending: true })
  if (error) return { data: null, error: toCmsError(error) }
  return { data: (data ?? []).map(fromRow), error: null }
}

export async function createMission(input: MissionInput): Promise<CmsResult<Mission>> {
  const client = await getCmsClient()
  if (!client) return unavailableResult()
  const { data, error } = await client.from('missions').insert(toRow(input)).select('*').single()
  if (error || !data) return { data: null, error: toCmsError(error) }
  return { data: fromRow(data), error: null }
}

export async function updateMission(id: string, input: MissionInput): Promise<CmsResult<Mission>> {
  const client = await getCmsClient()
  if (!client) return unavailableResult()
  const { data, error } = await client.from('missions').update(toRow(input)).eq('id', id).select('*').single()
  if (error || !data) return { data: null, error: toCmsError(error) }
  return { data: fromRow(data), error: null }
}

export async function deleteMission(id: string): Promise<CmsResult<null>> {
  const client = await getCmsClient()
  if (!client) return unavailableResult()
  const { error } = await client.from('missions').delete().eq('id', id)
  if (error) return { data: null, error: toCmsError(error) }
  return { data: null, error: null }
}
