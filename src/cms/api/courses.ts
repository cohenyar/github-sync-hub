import type { CmsResult, Course, CourseInput } from '../types'
import { getCmsClient, toCmsError, unavailableResult } from './shared'

function fromRow(row: {
  id: string
  title: string
  description: string | null
  subject: string
  status: string
  display_order: number
  created_at: string
  updated_at: string
}): Course {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    subject: row.subject,
    status: row.status === 'active' ? 'active' : 'draft',
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toRow(input: CourseInput) {
  return {
    title: input.title,
    description: input.description,
    subject: input.subject,
    status: input.status,
    display_order: input.displayOrder,
  }
}

/** Ordered by display_order — admins see every status (RLS grants admins full read); this is never called for player-facing reads. */
export async function listCourses(): Promise<CmsResult<Course[]>> {
  const client = await getCmsClient()
  if (!client) return unavailableResult()
  const { data, error } = await client.from('courses').select('*').order('display_order', { ascending: true })
  if (error) return { data: null, error: toCmsError(error) }
  return { data: (data ?? []).map(fromRow), error: null }
}

export async function createCourse(input: CourseInput): Promise<CmsResult<Course>> {
  const client = await getCmsClient()
  if (!client) return unavailableResult()
  const { data, error } = await client.from('courses').insert(toRow(input)).select('*').single()
  if (error || !data) return { data: null, error: toCmsError(error) }
  return { data: fromRow(data), error: null }
}

export async function updateCourse(id: string, input: CourseInput): Promise<CmsResult<Course>> {
  const client = await getCmsClient()
  if (!client) return unavailableResult()
  const { data, error } = await client.from('courses').update(toRow(input)).eq('id', id).select('*').single()
  if (error || !data) return { data: null, error: toCmsError(error) }
  return { data: fromRow(data), error: null }
}

export async function deleteCourse(id: string): Promise<CmsResult<null>> {
  const client = await getCmsClient()
  if (!client) return unavailableResult()
  const { error } = await client.from('courses').delete().eq('id', id)
  if (error) return { data: null, error: toCmsError(error) }
  return { data: null, error: null }
}
