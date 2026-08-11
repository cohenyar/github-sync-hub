import type { CmsResult, Lesson, LessonInput } from '../types'
import { getCmsClient, toCmsError, unavailableResult } from './shared'

function fromRow(row: {
  id: string
  course_id: string
  title: string
  content: string | null
  display_order: number
  status: string
  created_at: string
  updated_at: string
}): Lesson {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    content: row.content,
    status: row.status === 'active' ? 'active' : 'draft',
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toRow(input: LessonInput) {
  return {
    course_id: input.courseId,
    title: input.title,
    content: input.content,
    status: input.status,
    display_order: input.displayOrder,
  }
}

export async function listLessons(courseId: string): Promise<CmsResult<Lesson[]>> {
  const client = await getCmsClient()
  if (!client) return unavailableResult()
  const { data, error } = await client
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('display_order', { ascending: true })
  if (error) return { data: null, error: toCmsError(error) }
  return { data: (data ?? []).map(fromRow), error: null }
}

export async function createLesson(input: LessonInput): Promise<CmsResult<Lesson>> {
  const client = await getCmsClient()
  if (!client) return unavailableResult()
  const { data, error } = await client.from('lessons').insert(toRow(input)).select('*').single()
  if (error || !data) return { data: null, error: toCmsError(error) }
  return { data: fromRow(data), error: null }
}

export async function updateLesson(id: string, input: LessonInput): Promise<CmsResult<Lesson>> {
  const client = await getCmsClient()
  if (!client) return unavailableResult()
  const { data, error } = await client.from('lessons').update(toRow(input)).eq('id', id).select('*').single()
  if (error || !data) return { data: null, error: toCmsError(error) }
  return { data: fromRow(data), error: null }
}

export async function deleteLesson(id: string): Promise<CmsResult<null>> {
  const client = await getCmsClient()
  if (!client) return unavailableResult()
  const { error } = await client.from('lessons').delete().eq('id', id)
  if (error) return { data: null, error: toCmsError(error) }
  return { data: null, error: null }
}
