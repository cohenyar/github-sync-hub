import type { Json } from '../integrations/supabase/types'

/**
 * Local, hand-written type shapes for the CMS tables (courses/lessons/
 * missions — see supabase/migrations/0004_cms_content_tables.sql).
 *
 * These tables are NOT in src/integrations/supabase/types.ts, and that file
 * must stay untouched: it is Lovable's generated Supabase codegen output,
 * regenerated automatically from the live schema, and hand-editing it would
 * be silently overwritten (or worse, drift from the real schema) the next
 * time Lovable regenerates it. This file is the temporary stand-in — once
 * the migrations run against the live project and Lovable regenerates
 * types.ts, these three table shapes should appear there for real and this
 * file's exports can be deleted in favor of the generated ones.
 *
 * Deliberately `type`, never `interface`: supabase-js's generic table
 * lookup requires each Row/Insert/Update to structurally satisfy
 * `Record<string, unknown>`, and a named `interface` (unlike a `type`
 * object literal) does not satisfy an index-signature type in TypeScript —
 * every `.from('courses')` call silently resolved to `never` until this was
 * switched from `interface` to `type`.
 */

export type CourseRow = {
  id: string
  title: string
  description: string | null
  subject: string
  status: string
  display_order: number
  created_at: string
  updated_at: string
}

export type CourseInsert = {
  id?: string
  title: string
  description?: string | null
  subject: string
  status?: string
  display_order?: number
  created_at?: string
  updated_at?: string
}

export type CourseUpdate = Partial<CourseInsert>

export type LessonRow = {
  id: string
  course_id: string
  title: string
  content: string | null
  display_order: number
  status: string
  created_at: string
  updated_at: string
}

export type LessonInsert = {
  id?: string
  course_id: string
  title: string
  content?: string | null
  display_order?: number
  status?: string
  created_at?: string
  updated_at?: string
}

export type LessonUpdate = Partial<LessonInsert>

export type MissionRow = {
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
}

export type MissionInsert = {
  id?: string
  lesson_id: string
  title: string
  objective: string
  instructions?: string | null
  task?: string | null
  answer_config?: Json | null
  hint?: string | null
  guidance_level_1?: string | null
  guidance_level_2?: string | null
  guidance_level_3?: string | null
  display_order?: number
  status?: string
  created_at?: string
  updated_at?: string
}

export type MissionUpdate = Partial<MissionInsert>

export type CmsTables = {
  courses: { Row: CourseRow; Insert: CourseInsert; Update: CourseUpdate; Relationships: [] }
  lessons: { Row: LessonRow; Insert: LessonInsert; Update: LessonUpdate; Relationships: [] }
  missions: { Row: MissionRow; Insert: MissionInsert; Update: MissionUpdate; Relationships: [] }
}
