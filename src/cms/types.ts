/**
 * Admin CMS pass — the database-backed content model (see
 * supabase/migrations/0004_cms_content_tables.sql). Deliberately separate
 * from src/missions/src/campaign/src/learning: those keep running the
 * existing hardcoded SQL campaign completely unchanged. This is the new,
 * small, editable model the admin manages, starting with one History
 * course — not a replacement, a parallel track content can gradually move
 * into later.
 */
export type ContentStatus = 'draft' | 'active'

/**
 * A course's associated NPC — display-only metadata, never a new 3D model
 * or an AI-generated identity: a small fixed set of deterministic presets
 * (see npcConfigDefaults.ts) the admin can hand-edit afterward. All color
 * fields are hex color strings (e.g. '#3d6b8a').
 */
export interface CourseNpcConfig {
  displayName: string
  role: string
  bodyColor: string
  skinTone: string
  hairColor: string
  hairStyle: 'short' | 'long' | 'bald' | 'bun'
  shirtColor: string
  pantsColor: string
  accessory?: string
}

export interface Course {
  id: string
  title: string
  description: string | null
  subject: string
  status: ContentStatus
  displayOrder: number
  npcConfig: CourseNpcConfig | null
  createdAt: string
  updatedAt: string
}

export interface Lesson {
  id: string
  courseId: string
  title: string
  content: string | null
  displayOrder: number
  status: ContentStatus
  createdAt: string
  updatedAt: string
}

/**
 * Data, never code: unlike the existing SQL campaign's referenceSql (a live
 * query executed against the mission's own database), a History mission's
 * "correct answer" has to be a small typed payload the admin UI reads and
 * writes and nothing ever executes. Kept as a closed union so the form can
 * switch on `type` — add a new variant here (and a matching form branch)
 * rather than widening this to an untyped blob.
 */
export type MissionAnswerConfig =
  | { type: 'exact_text'; acceptedAnswers: string[] }
  | { type: 'multiple_choice'; options: string[]; correctIndex: number }

export interface Mission {
  id: string
  lessonId: string
  title: string
  objective: string
  instructions: string | null
  task: string | null
  answerConfig: MissionAnswerConfig | null
  hint: string | null
  /** Difficulty-specific guidance for levels 1/2/3 — a genuine new capability the old hardcoded missions never had. */
  guidanceLevel1: string | null
  guidanceLevel2: string | null
  guidanceLevel3: string | null
  displayOrder: number
  status: ContentStatus
  createdAt: string
  updatedAt: string
}

/** Every admin-facing form/create/update input — id and timestamps are server-assigned, never supplied by the caller. */
export type CourseInput = Omit<Course, 'id' | 'createdAt' | 'updatedAt'>
export type LessonInput = Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>
export type MissionInput = Omit<Mission, 'id' | 'createdAt' | 'updatedAt'>

/** Shared result shape for every CMS mutation — never throws at the call site, same convention as AuthActionResult. */
export interface CmsResult<T> {
  data: T | null
  error: string | null
}
