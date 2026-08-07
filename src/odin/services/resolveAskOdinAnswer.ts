import { he } from '../../i18n'

export type AskOdinQuestionId = 'what-now' | 'hint' | 'explain-mission' | 'why-failed' | 'where-to-go'

export interface AskOdinContext {
  missionGoal: string
  missionPrompt: string
  missionHint?: string
  destinationName?: string
  /** The most recent QueryFailed-driven narration message, if any exists yet this session. */
  lastQueryFailedMessage: string | null
}

/**
 * Playtest fix pass (issue 6C) — the deterministic "Ask Odin" panel this
 * pass adds (no existing entry point was found anywhere in the codebase).
 * Every answer is resolved from data GameApp already computes (the active
 * mission's own text, the last QueryFailed narration) — no AI/LLM, no new
 * gameplay state, nothing persisted.
 */
export function resolveAskOdinAnswer(questionId: AskOdinQuestionId, context: AskOdinContext): string {
  switch (questionId) {
    case 'what-now':
      return context.missionGoal
    case 'hint':
      return context.missionHint ?? he.askOdinNoHintFallback
    case 'explain-mission':
      return context.missionPrompt
    case 'why-failed':
      return context.lastQueryFailedMessage ?? he.askOdinNoErrorYetFallback
    case 'where-to-go':
      return context.destinationName
        ? `${he.askOdinWhereToGoPrefix}${context.destinationName}.`
        : he.askOdinNoDestinationFallback
    default:
      return he.askOdinNoHintFallback
  }
}
