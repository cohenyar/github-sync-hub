import { he } from '../../i18n'
import type { CmsResult, MissionAnswerConfig } from '../types'

/**
 * Admin AI content-generation pass — service interface only. There is NO
 * AI backend wired up anywhere in this project (verified: no LLM provider,
 * no edge function, no generation endpoint exists in this repo). Per the
 * explicit brief, this must never fake a generation result — every call
 * below returns a clear "not configured" error until a real backend exists.
 *
 * What would be needed to make this real (do this outside the frontend,
 * never in client code):
 *   1. A server-side endpoint — the natural fit on this stack is a Supabase
 *      Edge Function (e.g. `generate-admin-content`) that receives
 *      AiDraftRequest, calls an LLM provider (OpenAI/Anthropic/Gemini/etc.)
 *      with a server-stored secret (a Supabase Function secret, never a
 *      frontend env var), and returns AiDraftCourse-shaped JSON.
 *   2. The Edge Function's own system prompt MUST enforce (see the user's
 *      AI Safety/Quality brief):
 *        - never invent citations or sources
 *        - never state uncertain historical facts as verified — mark them
 *          via `needsReview` instead
 *        - age-appropriate language for the given audience
 *        - Hebrew by default unless the admin requests otherwise
 *        - no offensive/discriminatory content
 *   3. Auth: the Edge Function must itself verify the caller is an admin
 *      (reuse the existing `is_admin(auth.uid())` check) before spending
 *      any AI budget — this file's caller is already gated behind
 *      ProtectedAdminRoute, but a callable Edge Function is a new surface
 *      and must not trust that alone.
 *   4. This file's `generateContentDraft` is the ONLY place that would need
 *      to change (call the Edge Function via the existing Supabase client
 *      instead of returning `unavailableResult()`) — no UI change required
 *      when that lands.
 */

export type AiDifficulty = 1 | 2 | 3

export interface AiDraftRequest {
  topic: string
  audience: string
  lessonCount: number
  language?: string
}

export interface AiDraftMission {
  title: string
  objective: string
  instructions: string
  task: string
  answerConfig: MissionAnswerConfig
  hint: string
  guidanceLevel1: string
  guidanceLevel2: string
  guidanceLevel3: string
  /** Set by the (future) AI backend when it isn't confident in a fact — surfaced to the admin, never hidden. */
  needsReview: boolean
}

export interface AiDraftLesson {
  title: string
  content: string
  missions: AiDraftMission[]
}

export interface AiDraftCourse {
  title: string
  description: string
  subject: string
  lessons: AiDraftLesson[]
}

/**
 * Always returns the "unavailable" result today — see the file-level
 * comment. Never returns fabricated content under any input.
 */
export async function generateContentDraft(_request: AiDraftRequest): Promise<CmsResult<AiDraftCourse>> {
  return { data: null, error: he.aiGeneratorUnavailableMessage }
}
